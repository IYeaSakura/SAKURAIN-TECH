/**
 * 获取友链RSS接口 - 从KV缓存获取，超时自动刷新
 *
 * 查询参数:
 * - url: 要获取的 feed URL (必需)
 *
 * 缓存策略:
 * - 默认缓存 24 小时
 * - 如果缓存过期或不存在，自动触发刷新
 * - 缓存键包含 URL，不同 URL 独立缓存
 * - 如果源被标记为失败（通过refresh接口），跳过自动刷新
 *
 * 返回:
 * - content: RSS/Atom feed 内容
 * - timestamp: 缓存更新时间戳
 * - fromCache: 是否来自缓存
 */

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 小时，单位毫秒

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

// 获取 feed 数据
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

  return {
    content,
    contentType,
  };
}

// 保存到 KV 缓存
async function saveToCache(kv, cacheKey, content, contentType) {
  if (!kv) return;

  try {
    await kv.put(cacheKey, JSON.stringify({
      content,
      contentType,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.error('KV put error:', e);
  }
}

export async function onRequestGet(context) {
  try {
    const { request } = context;
    const url = new URL(request.url);
    const feedUrl = url.searchParams.get('url');

    console.log(`[Feed Get] Request received for URL: ${feedUrl}`);

    // 验证 URL 参数
    if (!feedUrl) {
      return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 验证 URL 格式
    let targetUrl;
    try {
      targetUrl = new URL(feedUrl);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL format' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 只允许 http 和 https 协议
    if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
      return new Response(JSON.stringify({ error: 'Only HTTP/HTTPS protocols are allowed' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const kv = FEED_KV;
    const cacheKey = `feed:${feedUrl}`;
    const now = Date.now();

    // Check if source is marked as failed
    const failedStatus = await checkFailedSource(kv, feedUrl);
    if (failedStatus.failed) {
      console.log(`[Feed Get] Source marked as failed, skipping auto-refresh: ${feedUrl}`);

      // Try to return stale cache if available
      if (kv) {
        try {
          const cached = await kv.get(cacheKey);
          if (cached) {
            const data = JSON.parse(cached);
            return new Response(data.content, {
              headers: {
                'Content-Type': data.contentType || 'application/xml',
                'Access-Control-Allow-Origin': '*',
                'X-Cache': 'STALE',
                'X-Feed-Timestamp': data.timestamp.toString(),
                'X-Feed-Failed': 'true',
                'X-Feed-Failed-Reason': failedStatus.error || 'Unknown error',
                'X-Feed-Failed-Attempts': String(failedStatus.attempts),
              },
            });
          }
        } catch (e) {
          console.error('KV get stale cache error:', e);
        }
      }

      // No cache available, return error with failed info
      return new Response(JSON.stringify({
        error: 'Source marked as inaccessible',
        message: failedStatus.error || 'This feed source has been marked as failed',
        failedSince: failedStatus.timestamp,
        attempts: failedStatus.attempts,
        hint: 'Use refresh API to retry and potentially clear the failed mark',
      }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Feed-Failed': 'true',
          'X-Feed-Failed-Attempts': String(failedStatus.attempts),
        },
      });
    }

    // 尝试从缓存获取
    if (kv) {
      try {
        const cached = await kv.get(cacheKey);
        console.log(`[Feed Get] KV lookup for ${cacheKey}: ${cached ? 'HIT' : 'MISS'}`);
        if (cached) {
          const data = JSON.parse(cached);

          // 检查缓存是否过期（24小时）
          if (data.timestamp && (now - data.timestamp) < CACHE_TTL) {
            return new Response(data.content, {
              headers: {
                'Content-Type': data.contentType || 'application/xml',
                'Access-Control-Allow-Origin': '*',
                'X-Cache': 'HIT',
                'X-Cache-Age': String(Math.floor((now - data.timestamp) / 1000)),
                'X-Cache-TTL': String(Math.floor((CACHE_TTL - (now - data.timestamp)) / 1000)),
                'X-Feed-Timestamp': data.timestamp.toString(),
              },
            });
          }
        }
      } catch (e) {
        console.error('KV get error:', e);
      }
    }

    // 缓存过期或不存在，自动刷新
    console.log(`[Feed Get] Fetching fresh data for: ${feedUrl}`);
    try {
      const { content, contentType } = await fetchFeedData(feedUrl);
      console.log(`[Feed Get] Successfully fetched ${content.length} bytes from ${feedUrl}`);

      // 保存到缓存
      await saveToCache(kv, cacheKey, content, contentType);
      console.log(`[Feed Get] Saved to KV cache: ${cacheKey}`);

      const currentTimestamp = Date.now();
      return new Response(content, {
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'X-Cache': 'MISS',
          'X-Feed-Timestamp': currentTimestamp.toString(),
          'X-Auto-Refresh': 'true',
        },
      });
    } catch (err) {
      console.error(`[Feed Get] Auto refresh error for ${feedUrl}:`, err);

      // 如果自动刷新失败，尝试返回过期的缓存（如果存在）
      if (kv) {
        try {
          const cached = await kv.get(cacheKey);
          if (cached) {
            const data = JSON.parse(cached);
            return new Response(data.content, {
              headers: {
                'Content-Type': data.contentType || 'application/xml',
                'Access-Control-Allow-Origin': '*',
                'X-Cache': 'STALE',
                'X-Feed-Timestamp': data.timestamp.toString(),
                'X-Cache-Error': 'Auto refresh failed, returning stale cache',
              },
            });
          }
        } catch (e) {
          console.error('KV get stale cache error:', e);
        }
      }

      // 没有缓存且刷新失败，返回错误
      return new Response(JSON.stringify({
        error: 'Failed to fetch feed',
        message: String(err),
      }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

  } catch (err) {
    console.error('Get feed error:', err);
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}