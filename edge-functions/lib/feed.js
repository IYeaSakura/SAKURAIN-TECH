/**
 * Friend-link RSS feed business logic for EdgeOne Pages Edge Functions.
 * Backed by FEED_KV; supports single get/refresh and batch get/refresh.
 */

import { SECURITY_HEADERS, addCorsHeaders, handleCorsPreflight } from './auth.js';
import { getKV } from './kv.js';

const CACHE_TTL = 24 * 60 * 60 * 1000;
const FORCE_REFRESH_COOLDOWN = 60 * 1000;
const FAILED_SOURCE_TTL = 7 * 24 * 60 * 60;

function getClientIP(request) {
  const cfConnectingIP = request.headers.get('CF-Connecting-IP');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  const xForwardedFor = request.headers.get('X-Forwarded-For');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIP = request.headers.get('X-Real-IP');
  if (xRealIP) {
    return xRealIP;
  }

  return 'unknown';
}

function buildBrowserHeaders() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  ];

  const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

  return {
    'User-Agent': userAgent,
    'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, application/json, text/html, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-US;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
  };
}

function createJsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...SECURITY_HEADERS,
      ...extraHeaders,
    },
  });
}

async function checkFailedSource(kv, feedUrl) {
  const failedKey = `feed:failed:${feedUrl}`;
  try {
    const failedData = await kv.get(failedKey);
    if (failedData) {
      const data = JSON.parse(failedData);
      return {
        failed: true,
        error: data.error,
        timestamp: data.timestamp,
        attempts: data.attempts || 1,
      };
    }
  } catch (e) {
    console.error('KV get failed source error:', e);
  }
  return { failed: false };
}

async function markSourceFailed(kv, feedUrl, error) {
  const failedKey = `feed:failed:${feedUrl}`;
  try {
    const existing = await kv.get(failedKey);
    let attempts = 1;
    if (existing) {
      const data = JSON.parse(existing);
      attempts = (data.attempts || 0) + 1;
    }

    await kv.put(
      failedKey,
      JSON.stringify({
        error,
        timestamp: Date.now(),
        attempts,
      }),
      {
        expirationTtl: FAILED_SOURCE_TTL,
      }
    );
    console.log(`[Feed] Marked source as failed: ${feedUrl} (attempt ${attempts})`);
  } catch (e) {
    console.error('KV put failed source error:', e);
  }
}

async function clearFailedMark(kv, feedUrl) {
  const failedKey = `feed:failed:${feedUrl}`;
  try {
    await kv.delete(failedKey);
    console.log(`[Feed] Cleared failed mark for: ${feedUrl}`);
  } catch (e) {
    console.error('KV delete failed source error:', e);
  }
}

async function getCachedFeed(kv, feedUrl) {
  const cacheKey = `feed:${feedUrl}`;
  try {
    const cached = await kv.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      return {
        content: data.content,
        contentType: data.contentType || 'application/xml',
        timestamp: data.timestamp,
        age: Date.now() - data.timestamp,
        isExpired: Date.now() - data.timestamp >= CACHE_TTL,
      };
    }
  } catch (e) {
    console.error('KV get error:', e);
  }
  return null;
}

async function saveFeedToCache(kv, feedUrl, content, contentType) {
  const cacheKey = `feed:${feedUrl}`;
  try {
    await kv.put(
      cacheKey,
      JSON.stringify({
        content,
        contentType,
        timestamp: Date.now(),
      })
    );
  } catch (e) {
    console.error('KV put error:', e);
  }
}

function isValidFeed(content) {
  return (
    content.includes('<rss') ||
    content.includes('<feed') ||
    content.includes('<?xml') ||
    content.includes('"items"') ||
    content.includes('"entries"')
  );
}

async function fetchFeedData(feedUrl) {
  const feedResponse = await fetch(feedUrl, {
    method: 'GET',
    headers: buildBrowserHeaders(),
  });

  if (!feedResponse.ok) {
    throw new Error(`Failed to fetch feed: HTTP ${feedResponse.status}`);
  }

  const content = await feedResponse.text();
  const contentType = feedResponse.headers.get('content-type') || 'application/xml';

  return { content, contentType };
}

async function checkForceRefreshLimit(kv, ip, feedUrl) {
  const key = `feed:force:${ip}:${feedUrl}`;
  try {
    const data = await kv.get(key);

    if (!data) {
      return { allowed: true };
    }

    const lastRefresh = parseInt(data, 10);
    const now = Date.now();
    const elapsed = now - lastRefresh;

    if (elapsed < FORCE_REFRESH_COOLDOWN) {
      const remaining = Math.ceil((FORCE_REFRESH_COOLDOWN - elapsed) / 1000);
      return { allowed: false, remaining };
    }
  } catch (e) {
    console.error('KV force refresh limit error:', e);
  }

  return { allowed: true };
}

async function recordForceRefresh(kv, ip, feedUrl) {
  const key = `feed:force:${ip}:${feedUrl}`;
  try {
    await kv.put(key, Date.now().toString(), {
      expirationTtl: Math.ceil(FORCE_REFRESH_COOLDOWN / 1000) + 60,
    });
  } catch (e) {
    console.error('KV record force refresh error:', e);
  }
}

async function fetchSingleFeed(feed, kv) {
  const feedUrl = feed.url;
  const feedName = feed.name || 'Unknown';

  try {
    const feedResponse = await fetch(feedUrl, {
      method: 'GET',
      headers: buildBrowserHeaders(),
    });

    if (!feedResponse.ok) {
      const errorMsg = `Failed to fetch feed: HTTP ${feedResponse.status}`;
      await markSourceFailed(kv, feedUrl, errorMsg);
      return {
        success: false,
        url: feedUrl,
        name: feedName,
        error: errorMsg,
      };
    }

    const content = await feedResponse.text();
    const contentType = feedResponse.headers.get('content-type') || 'application/xml';

    if (!isValidFeed(content)) {
      const errorMsg = 'Invalid feed format: response is not a valid RSS/Atom feed';
      await markSourceFailed(kv, feedUrl, errorMsg);
      return {
        success: false,
        url: feedUrl,
        name: feedName,
        error: errorMsg,
      };
    }

    const timestamp = Date.now();
    await saveFeedToCache(kv, feedUrl, content, contentType);
    await clearFailedMark(kv, feedUrl);

    return {
      success: true,
      url: feedUrl,
      name: feedName,
      content,
      contentType,
      timestamp,
    };
  } catch (err) {
    const errorMsg = String(err);
    await markSourceFailed(kv, feedUrl, errorMsg);
    return {
      success: false,
      url: feedUrl,
      name: feedName,
      error: errorMsg,
    };
  }
}

/**
 * GET /api/feed/get - fetch a single feed from cache or source.
 */
export async function handleGet(request, env) {
  if (request.method === 'OPTIONS') {
    return handleCorsPreflight('GET, OPTIONS');
  }

  try {
    const url = new URL(request.url);
    const feedUrl = url.searchParams.get('url');

    console.log(`[Feed Get] Request received for URL: ${feedUrl}`);

    if (!feedUrl) {
      return addCorsHeaders(createJsonResponse({ error: 'Missing url parameter' }, 400));
    }

    let targetUrl;
    try {
      targetUrl = new URL(feedUrl);
    } catch {
      return addCorsHeaders(createJsonResponse({ error: 'Invalid URL format' }, 400));
    }

    if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
      return addCorsHeaders(createJsonResponse({ error: 'Only HTTP/HTTPS protocols are allowed' }, 400));
    }

    const kv = getKV('FEED_KV', env);
    if (!kv) {
      return addCorsHeaders(createJsonResponse({ error: 'KV not bound' }, 500));
    }

    const cacheKey = `feed:${feedUrl}`;
    const now = Date.now();

    const failedStatus = await checkFailedSource(kv, feedUrl);
    if (failedStatus.failed) {
      console.log(`[Feed Get] Source marked as failed, skipping auto-refresh: ${feedUrl}`);

      try {
        const cached = await kv.get(cacheKey);
        if (cached) {
          const data = JSON.parse(cached);
          return addCorsHeaders(new Response(data.content, {
            headers: {
              'Content-Type': data.contentType || 'application/xml',
              'Access-Control-Allow-Origin': '*',
              ...SECURITY_HEADERS,
              'X-Cache': 'STALE',
              'X-Feed-Timestamp': data.timestamp.toString(),
              'X-Feed-Failed': 'true',
              'X-Feed-Failed-Reason': failedStatus.error || 'Unknown error',
              'X-Feed-Failed-Attempts': String(failedStatus.attempts),
            },
          }));
        }
      } catch (e) {
        console.error('KV get stale cache error:', e);
      }

      return addCorsHeaders(createJsonResponse(
        {
          error: 'Source marked as inaccessible',
          message: failedStatus.error || 'This feed source has been marked as failed',
          failedSince: failedStatus.timestamp,
          attempts: failedStatus.attempts,
          hint: 'Use refresh API to retry and potentially clear the failed mark',
        },
        502,
        {
          'X-Feed-Failed': 'true',
          'X-Feed-Failed-Attempts': String(failedStatus.attempts),
        }
      ));
    }

    try {
      const cached = await kv.get(cacheKey);
      console.log(`[Feed Get] KV lookup for ${cacheKey}: ${cached ? 'HIT' : 'MISS'}`);
      if (cached) {
        const data = JSON.parse(cached);
        if (data.timestamp && now - data.timestamp < CACHE_TTL) {
          return addCorsHeaders(new Response(data.content, {
            headers: {
              'Content-Type': data.contentType || 'application/xml',
              'Access-Control-Allow-Origin': '*',
              ...SECURITY_HEADERS,
              'X-Cache': 'HIT',
              'X-Cache-Age': String(Math.floor((now - data.timestamp) / 1000)),
              'X-Cache-TTL': String(Math.floor((CACHE_TTL - (now - data.timestamp)) / 1000)),
              'X-Feed-Timestamp': data.timestamp.toString(),
            },
          }));
        }
      }
    } catch (e) {
      console.error('KV get error:', e);
    }

    console.log(`[Feed Get] Fetching fresh data for: ${feedUrl}`);
    try {
      const { content, contentType } = await fetchFeedData(feedUrl);
      console.log(`[Feed Get] Successfully fetched ${content.length} bytes from ${feedUrl}`);

      await saveFeedToCache(kv, feedUrl, content, contentType);
      console.log(`[Feed Get] Saved to KV cache: ${cacheKey}`);

      const currentTimestamp = Date.now();
      return addCorsHeaders(new Response(content, {
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          ...SECURITY_HEADERS,
          'X-Cache': 'MISS',
          'X-Feed-Timestamp': currentTimestamp.toString(),
          'X-Auto-Refresh': 'true',
        },
      }));
    } catch (err) {
      console.error(`[Feed Get] Auto refresh error for ${feedUrl}:`, err);

      try {
        const cached = await kv.get(cacheKey);
        if (cached) {
          const data = JSON.parse(cached);
          return addCorsHeaders(new Response(data.content, {
            headers: {
              'Content-Type': data.contentType || 'application/xml',
              'Access-Control-Allow-Origin': '*',
              ...SECURITY_HEADERS,
              'X-Cache': 'STALE',
              'X-Feed-Timestamp': data.timestamp.toString(),
              'X-Cache-Error': 'Auto refresh failed, returning stale cache',
            },
          }));
        }
      } catch (e) {
        console.error('KV get stale cache error:', e);
      }

      return addCorsHeaders(createJsonResponse(
        {
          error: 'Failed to fetch feed',
          message: String(err),
        },
        502
      ));
    }
  } catch (err) {
    console.error('Get feed error:', err);
    return addCorsHeaders(createJsonResponse({ error: String(err) }, 500));
  }
}

/**
 * GET /api/feed/refresh - force refresh a single feed cache.
 */
export async function handleRefresh(request, env) {
  if (request.method === 'OPTIONS') {
    return handleCorsPreflight('GET, OPTIONS');
  }

  try {
    const url = new URL(request.url);
    const feedUrl = url.searchParams.get('url');
    const clientIP = getClientIP(request);

    console.log(`[Feed Refresh] Force refresh request for: ${feedUrl} from IP: ${clientIP}`);

    if (!feedUrl) {
      return addCorsHeaders(createJsonResponse({ error: 'Missing url parameter' }, 400));
    }

    try {
      new URL(feedUrl);
    } catch {
      return addCorsHeaders(createJsonResponse({ error: 'Invalid URL format' }, 400));
    }

    const kv = getKV('FEED_KV', env);
    if (!kv) {
      return addCorsHeaders(createJsonResponse({ error: 'KV not bound' }, 500));
    }

    const forceLimit = await checkForceRefreshLimit(kv, clientIP, feedUrl);
    if (!forceLimit.allowed) {
      return addCorsHeaders(createJsonResponse(
        {
          error: 'Force refresh cooldown',
          message: `Please wait ${forceLimit.remaining} seconds before forcing refresh again`,
          remaining: forceLimit.remaining,
        },
        429,
        {
          'Retry-After': forceLimit.remaining?.toString() || '60',
          'X-Force-Refresh-Limit': 'true',
        }
      ));
    }

    try {
      const feedResponse = await fetch(feedUrl, {
        method: 'GET',
        headers: buildBrowserHeaders(),
      });

      if (!feedResponse.ok) {
        const errorMsg = `Failed to fetch feed: HTTP ${feedResponse.status}`;
        await markSourceFailed(kv, feedUrl, errorMsg);
        return addCorsHeaders(createJsonResponse(
          {
            error: errorMsg,
            status: feedResponse.status,
            markedAsFailed: true,
          },
          502,
          { 'X-Feed-Failed': 'true' }
        ));
      }

      const content = await feedResponse.text();
      const contentType = feedResponse.headers.get('content-type') || 'application/xml';

      if (!isValidFeed(content)) {
        const errorMsg = 'Invalid feed format: response is not a valid RSS/Atom feed';
        await markSourceFailed(kv, feedUrl, errorMsg);
        return addCorsHeaders(createJsonResponse(
          {
            error: errorMsg,
            markedAsFailed: true,
          },
          502,
          { 'X-Feed-Failed': 'true' }
        ));
      }

      const currentTimestamp = Date.now();
      await saveFeedToCache(kv, feedUrl, content, contentType);
      await clearFailedMark(kv, feedUrl);
      await recordForceRefresh(kv, clientIP, feedUrl);

      return addCorsHeaders(new Response(content, {
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          ...SECURITY_HEADERS,
          'X-Cache': 'MISS',
          'X-Feed-Timestamp': currentTimestamp.toString(),
          'X-Force-Refresh': 'true',
        },
      }));
    } catch (fetchErr) {
      const errorMsg = String(fetchErr);
      await markSourceFailed(kv, feedUrl, errorMsg);
      console.error(`[Feed Refresh] Fetch error for ${feedUrl}:`, fetchErr);
      return addCorsHeaders(createJsonResponse(
        {
          error: errorMsg,
          markedAsFailed: true,
        },
        502,
        { 'X-Feed-Failed': 'true' }
      ));
    }
  } catch (err) {
    console.error('Refresh feed error:', err);
    return addCorsHeaders(createJsonResponse({ error: String(err) }, 500));
  }
}

/**
 * GET /api/feed/batch-get - retrieve cache status for many feeds at once.
 */
export async function handleBatchGet(request, env) {
  if (request.method === 'OPTIONS') {
    return handleCorsPreflight('GET, OPTIONS');
  }

  try {
    const url = new URL(request.url);
    const feedsParam = url.searchParams.get('feeds');

    console.log('[Feed Batch Get] Request received');

    if (!feedsParam) {
      return addCorsHeaders(createJsonResponse({ error: 'Missing feeds parameter' }, 400));
    }

    let feeds;
    try {
      feeds = JSON.parse(feedsParam);
      if (!Array.isArray(feeds)) {
        throw new Error('feeds must be an array');
      }
    } catch (e) {
      return addCorsHeaders(createJsonResponse(
        { error: 'Invalid feeds parameter format', message: String(e) },
        400
      ));
    }

    const kv = getKV('FEED_KV', env);

    const result = {
      cached: [],
      missing: [],
      expired: [],
      failed: [],
    };

    const feedChecks = feeds.map(async (feed) => {
      const feedUrl = feed.url;
      const feedName = feed.name || 'Unknown';

      try {
        new URL(feedUrl);
      } catch {
        result.failed.push({
          url: feedUrl,
          name: feedName,
          error: 'Invalid URL format',
        });
        return;
      }

      const failedStatus = await checkFailedSource(kv, feedUrl);
      if (failedStatus.failed) {
        result.failed.push({
          url: feedUrl,
          name: feedName,
          error: failedStatus.error,
          timestamp: failedStatus.timestamp,
          attempts: failedStatus.attempts,
        });
        return;
      }

      const cached = await getCachedFeed(kv, feedUrl);

      if (!cached) {
        result.missing.push({ url: feedUrl, name: feedName });
      } else if (cached.isExpired) {
        result.expired.push({
          url: feedUrl,
          name: feedName,
          timestamp: cached.timestamp,
          age: cached.age,
        });
        result.cached.push({
          url: feedUrl,
          name: feedName,
          content: cached.content,
          contentType: cached.contentType,
          timestamp: cached.timestamp,
          fromCache: true,
          isExpired: true,
        });
      } else {
        result.cached.push({
          url: feedUrl,
          name: feedName,
          content: cached.content,
          contentType: cached.contentType,
          timestamp: cached.timestamp,
          fromCache: true,
          isExpired: false,
        });
      }
    });

    await Promise.all(feedChecks);

    console.log(
      `[Feed Batch Get] Results: ${result.cached.length} cached, ${result.missing.length} missing, ${result.expired.length} expired, ${result.failed.length} failed`
    );

    return addCorsHeaders(createJsonResponse(result, 200, {
      'X-Batch-Result': `${result.cached.length}/${feeds.length}`,
    }));
  } catch (err) {
    console.error('Batch get feed error:', err);
    return addCorsHeaders(createJsonResponse({ error: String(err) }, 500));
  }
}

async function checkBatchForceRefreshLimit(kv, ip) {
  const key = `feed:batch-force:${ip}`;
  try {
    const data = await kv.get(key);

    if (!data) {
      return { allowed: true };
    }

    const lastRefresh = parseInt(data, 10);
    const now = Date.now();
    const elapsed = now - lastRefresh;

    if (elapsed < FORCE_REFRESH_COOLDOWN) {
      const remaining = Math.ceil((FORCE_REFRESH_COOLDOWN - elapsed) / 1000);
      return { allowed: false, remaining };
    }
  } catch (e) {
    console.error('KV batch force refresh limit error:', e);
  }

  return { allowed: true };
}

async function recordBatchForceRefresh(kv, ip) {
  const key = `feed:batch-force:${ip}`;
  try {
    await kv.put(key, Date.now().toString(), {
      expirationTtl: Math.ceil(FORCE_REFRESH_COOLDOWN / 1000) + 60,
    });
  } catch (e) {
    console.error('KV record batch force refresh error:', e);
  }
}

/**
 * POST /api/feed/batch-refresh - force refresh many feeds with concurrency limit.
 */
export async function handleBatchRefresh(request, env) {
  if (request.method === 'OPTIONS') {
    return handleCorsPreflight('POST, OPTIONS');
  }

  try {
    const clientIP = getClientIP(request);

    let body;
    try {
      body = await request.json();
    } catch {
      return addCorsHeaders(createJsonResponse({ error: 'Invalid JSON body' }, 400));
    }

    const { feeds, force = false } = body;

    if (!feeds || !Array.isArray(feeds) || feeds.length === 0) {
      return addCorsHeaders(createJsonResponse({ error: 'Missing or invalid feeds array' }, 400));
    }

    console.log(`[Feed Batch Refresh] Request from ${clientIP} for ${feeds.length} feeds`);

    const kv = getKV('FEED_KV', env);
    if (!kv) {
      return addCorsHeaders(createJsonResponse({ error: 'KV not bound' }, 500));
    }

    if (!force) {
      const forceLimit = await checkBatchForceRefreshLimit(kv, clientIP);
      if (!forceLimit.allowed) {
        return addCorsHeaders(createJsonResponse(
          {
            error: 'Force refresh cooldown',
            message: `Please wait ${forceLimit.remaining} seconds before batch refresh again`,
            remaining: forceLimit.remaining,
          },
          429,
          {
            'Retry-After': forceLimit.remaining?.toString() || '60',
          }
        ));
      }
    }

    const result = {
      success: [],
      failed: [],
    };

    const CONCURRENT_LIMIT = 5;
    for (let i = 0; i < feeds.length; i += CONCURRENT_LIMIT) {
      const batch = feeds.slice(i, i + CONCURRENT_LIMIT);
      const batchResults = await Promise.all(batch.map((feed) => fetchSingleFeed(feed, kv)));

      batchResults.forEach((res) => {
        if (res.success) {
          result.success.push({
            url: res.url,
            name: res.name,
            content: res.content,
            contentType: res.contentType,
            timestamp: res.timestamp,
          });
        } else {
          result.failed.push({
            url: res.url,
            name: res.name,
            error: res.error,
          });
        }
      });
    }

    if (!force) {
      await recordBatchForceRefresh(kv, clientIP);
    }

    console.log(
      `[Feed Batch Refresh] Completed: ${result.success.length} success, ${result.failed.length} failed`
    );

    return addCorsHeaders(createJsonResponse(result, 200, {
      'X-Batch-Result': `${result.success.length}/${feeds.length}`,
    }));
  } catch (err) {
    console.error('Batch refresh feed error:', err);
    return addCorsHeaders(createJsonResponse({ error: String(err) }, 500));
  }
}
