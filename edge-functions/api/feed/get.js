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
 *
 * 返回:
 * - content: RSS/Atom feed 内容
 * - timestamp: 缓存更新时间戳
 * - fromCache: 是否来自缓存
 */

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 小时，单位毫秒

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
    headers: {
      'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, application/json, */*',
      'User-Agent': 'SAKURAIN-Feed-Proxy/1.0',
    },
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

    // 尝试从缓存获取
    if (kv) {
      try {
        const cached = await kv.get(cacheKey);
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
    try {
      const { content, contentType } = await fetchFeedData(feedUrl);

      // 保存到缓存
      await saveToCache(kv, cacheKey, content, contentType);

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
      console.error('Auto refresh error:', err);

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