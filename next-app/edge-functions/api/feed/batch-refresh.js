/**
 * 批量刷新友链RSS接口 - 强制刷新多个RSS源的KV缓存
 *
 * 请求方式: POST
 *
 * 请求体:
 * - feeds: 数组，包含需要刷新的feed URL和名称
 *   例如: [{"url":"https://example.com/feed","name":"Example Blog"}]
 * - force: 布尔值，是否强制刷新（忽略60秒限制）
 *
 * 返回:
 * - success: 成功刷新的feed数组
 * - failed: 刷新失败的feed数组
 * - skipped: 被跳过的feed数组（冷却中）
 */

const FORCE_REFRESH_COOLDOWN = 60 * 1000; // 60 秒强制刷新冷却
const FAILED_SOURCE_TTL = 7 * 24 * 60 * 60; // 失败标记保留7天

// Check if source is marked as failed
async function checkFailedSource(kv, feedUrl) {
  if (!kv) return { failed: false };

  const failedKey = `feed:failed:${feedUrl}`;
  try {
    const failedData = await kv.get(failedKey);
    if (failedData) {
      const data = JSON.parse(failedData);
      return {
        failed: true,
        error: data.error,
        timestamp: data.timestamp,
        attempts: data.attempts || 1
      };
    }
  } catch (e) {
    console.error('KV get failed source error:', e);
  }
  return { failed: false };
}

// Mark source as failed
async function markSourceFailed(kv, feedUrl, error) {
  if (!kv) return;

  const failedKey = `feed:failed:${feedUrl}`;
  try {
    const existing = await kv.get(failedKey);
    let attempts = 1;
    if (existing) {
      const data = JSON.parse(existing);
      attempts = (data.attempts || 0) + 1;
    }

    await kv.put(failedKey, JSON.stringify({
      error: error,
      timestamp: Date.now(),
      attempts: attempts,
    }), {
      expirationTtl: FAILED_SOURCE_TTL,
    });
    console.log(`[Feed Batch Refresh] Marked source as failed: ${feedUrl} (attempt ${attempts})`);
  } catch (e) {
    console.error('KV put failed source error:', e);
  }
}

// Clear failed mark when source becomes accessible
async function clearFailedMark(kv, feedUrl) {
  if (!kv) return;

  const failedKey = `feed:failed:${feedUrl}`;
  try {
    await kv.delete(failedKey);
    console.log(`[Feed Batch Refresh] Cleared failed mark for: ${feedUrl}`);
  } catch (e) {
    console.error('KV delete failed source error:', e);
  }
}

// Build realistic browser request headers
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

// 检查强制刷新冷却时间（全局限制，不按URL）
async function checkForceRefreshLimit(ip) {
  const key = `feed:batch-force:${ip}`;
  const data = await FEED_KV.get(key);

  if (!data) {
    return { allowed: true };
  }

  const lastRefresh = parseInt(data, 10);
  const now = Date.now();
  const elapsed = now - lastRefresh;

  if (elapsed < FORCE_REFRESH_COOLDOWN) {
    const remaining = Math.ceil((FORCE_REFRESH_COOLDOWN - elapsed) / 1000);
    return {
      allowed: false,
      remaining,
    };
  }

  return { allowed: true };
}

// 记录强制刷新时间
async function recordForceRefresh(ip) {
  const key = `feed:batch-force:${ip}`;
  await FEED_KV.put(key, Date.now().toString(), {
    expirationTtl: Math.ceil(FORCE_REFRESH_COOLDOWN / 1000) + 60,
  });
}

// 获取客户端 IP
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

// 获取单个feed
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

    // 检查是否是有效的feed格式
    const isValidFeed = content.includes('<rss') ||
                        content.includes('<feed') ||
                        content.includes('<?xml') ||
                        content.includes('"items"') ||
                        content.includes('"entries"');

    if (!isValidFeed) {
      const errorMsg = 'Invalid feed format: response is not a valid RSS/Atom feed';
      await markSourceFailed(kv, feedUrl, errorMsg);
      return {
        success: false,
        url: feedUrl,
        name: feedName,
        error: errorMsg,
      };
    }

    // 保存到KV缓存
    const cacheKey = `feed:${feedUrl}`;
    const timestamp = Date.now();

    if (kv) {
      await kv.put(cacheKey, JSON.stringify({
        content,
        contentType,
        timestamp,
      }));
      await clearFailedMark(kv, feedUrl);
    }

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

export async function onRequestPost(context) {
  try {
    const { request } = context;
    const clientIP = getClientIP(request);

    // 解析请求体
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const { feeds, force = false } = body;

    if (!feeds || !Array.isArray(feeds) || feeds.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing or invalid feeds array' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    console.log(`[Feed Batch Refresh] Request from ${clientIP} for ${feeds.length} feeds`);

    // 如果不是强制刷新，检查冷却时间
    if (!force) {
      const forceLimit = await checkForceRefreshLimit(clientIP);
      if (!forceLimit.allowed) {
        return new Response(
          JSON.stringify({
            error: 'Force refresh cooldown',
            message: `Please wait ${forceLimit.remaining} seconds before batch refresh again`,
            remaining: forceLimit.remaining,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Retry-After': forceLimit.remaining.toString(),
            },
          }
        );
      }
    }

    const kv = FEED_KV;
    const result = {
      success: [],
      failed: [],
    };

    // 并行刷新所有feed（限制并发数为5，避免过载）
    const CONCURRENT_LIMIT = 5;
    for (let i = 0; i < feeds.length; i += CONCURRENT_LIMIT) {
      const batch = feeds.slice(i, i + CONCURRENT_LIMIT);
      const batchResults = await Promise.all(
        batch.map(feed => fetchSingleFeed(feed, kv))
      );

      batchResults.forEach(res => {
        if (res.success) {
          result.success.push(res);
        } else {
          result.failed.push(res);
        }
      });
    }

    // 记录刷新时间（如果不是强制刷新）
    if (!force) {
      await recordForceRefresh(clientIP);
    }

    console.log(`[Feed Batch Refresh] Completed: ${result.success.length} success, ${result.failed.length} failed`);

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Batch-Result': `${result.success.length}/${feeds.length}`,
      },
    });

  } catch (err) {
    console.error('Batch refresh feed error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
