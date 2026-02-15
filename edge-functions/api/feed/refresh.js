/**
 * 刷新友链RSS接口 - 强制刷新KV缓存，60s速率限制
 *
 * 查询参数:
 * - url: 要获取的 feed URL (必需)
 *
 * 缓存策略:
 * - 强制刷新缓存，忽略过期时间
 * - 更新KV存储库中的RSS订阅信息缓存
 * - 将更新时间改为本次调用接口的时间
 *
 * 速率限制:
 * - 每IP每60秒只能调用一次
 */

const FORCE_REFRESH_COOLDOWN = 60 * 1000; // 60 秒强制刷新冷却

// 检查强制刷新冷却时间
async function checkForceRefreshLimit(ip) {
  const key = `feed:force:${ip}`;
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
  const key = `feed:force:${ip}`;
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

export async function onRequestGet(context) {
  try {
    const { request } = context;
    const url = new URL(request.url);
    const feedUrl = url.searchParams.get('url');
    const clientIP = getClientIP(request);

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

    // 检查强制刷新冷却时间
    const forceLimit = await checkForceRefreshLimit(clientIP);
    if (!forceLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Force refresh cooldown',
          message: `Please wait ${forceLimit.remaining} seconds before forcing refresh again`,
          remaining: forceLimit.remaining,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Retry-After': forceLimit.remaining.toString(),
            'X-Force-Refresh-Limit': 'true',
          },
        }
      );
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

    // 保存到 KV 缓存
    const kv = FEED_KV;
    const cacheKey = `feed:${feedUrl}`;
    const currentTimestamp = Date.now();

    if (kv) {
      try {
        await kv.put(cacheKey, JSON.stringify({
          content,
          contentType,
          timestamp: currentTimestamp,
        }));
      } catch (e) {
        console.error('KV put error:', e);
      }
    }

    // 记录强制刷新时间
    await recordForceRefresh(clientIP);

    return new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'MISS',
        'X-Feed-Timestamp': currentTimestamp.toString(),
        'X-Force-Refresh': 'true',
      },
    });

  } catch (err) {
    console.error('Refresh feed error:', err);
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