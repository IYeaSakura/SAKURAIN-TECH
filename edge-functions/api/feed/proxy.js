/**
 * Feed 代理 - 带 KV 缓存
 * 
 * 查询参数:
 * - url: 要获取的 feed URL (必需)
 * - force: 强制刷新缓存，忽略过期时间 (可选，传入任意值即生效)
 * 
 * 缓存策略:
 * - 默认缓存 30 分钟
 * - 支持强制刷新
 * - 缓存键包含 URL，不同 URL 独立缓存
 */

const CACHE_TTL = 30 * 60 * 1000; // 30 分钟，单位毫秒

export async function onRequestGet(context) {
  try {
    const { request } = context;
    const url = new URL(request.url);
    const feedUrl = url.searchParams.get('url');
    const forceRefresh = url.searchParams.has('force');

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

    const kv = context.env?.FEED_KV;
    const cacheKey = `feed:${feedUrl}`;

    // 尝试从缓存获取（如果不是强制刷新）
    if (!forceRefresh && kv) {
      try {
        const cached = await kv.get(cacheKey);
        if (cached) {
          const data = JSON.parse(cached);
          const now = Date.now();
          
          // 检查缓存是否过期
          if (data.timestamp && (now - data.timestamp) < CACHE_TTL) {
            return new Response(data.content, {
              headers: {
                'Content-Type': data.contentType || 'application/xml',
                'Access-Control-Allow-Origin': '*',
                'X-Cache': 'HIT',
                'X-Cache-Age': String(Math.floor((now - data.timestamp) / 1000)),
              },
            });
          }
        }
      } catch (e) {
        console.error('KV get error:', e);
        // 缓存读取失败，继续获取新数据
      }
    }

    // 获取 feed 数据
    const feedResponse = await fetch(feedUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, application/json, */*',
        'User-Agent': 'SAKURAIN-Feed-Proxy/1.0',
      },
    });

    if (!feedResponse.ok) {
      return new Response(JSON.stringify({ 
        error: `Failed to fetch feed: HTTP ${feedResponse.status}`,
        status: feedResponse.status 
      }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const content = await feedResponse.text();
    const contentType = feedResponse.headers.get('content-type') || 'application/xml';

    // 保存到缓存
    if (kv) {
      try {
        await kv.put(cacheKey, JSON.stringify({
          content,
          contentType,
          timestamp: Date.now(),
        }));
      } catch (e) {
        console.error('KV put error:', e);
        // 缓存失败不影响响应
      }
    }

    return new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'MISS',
      },
    });

  } catch (err) {
    console.error('Feed proxy error:', err);
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
