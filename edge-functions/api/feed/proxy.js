/**
 * Feed 代理 - 带 KV 缓存和速率限制
 * 
 * 查询参数:
 * - url: 要获取的 feed URL (必需)
 * - force: 强制刷新缓存，忽略过期时间 (可选，传入任意值即生效)
 * 
 * 缓存策略:
 * - 默认缓存 24 小时
 * - 支持强制刷新（每 IP 每 60 秒限 1 次）
 * - 缓存键包含 URL，不同 URL 独立缓存
 * 
 * 速率限制:
 * - 普通请求：60次/分钟
 * - 强制刷新：1次/60秒
 */

import { checkRateLimit, createRateLimitResponse } from '../../rate-limit.js';

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 小时，单位毫秒
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
    const forceRefresh = url.searchParams.has('force');
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

    // 检查通用速率限制
    const rateLimitResult = await checkRateLimit(request);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests, please try again later',
          resetIn: rateLimitResult.resetIn,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Retry-After': rateLimitResult.resetIn?.toString() || '60',
          },
        }
      );
    }

    // 如果是强制刷新，检查额外的冷却时间
    if (forceRefresh) {
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
          
          // 检查缓存是否过期（24小时）
          if (data.timestamp && (now - data.timestamp) < CACHE_TTL) {
            return new Response(data.content, {
              headers: {
                'Content-Type': data.contentType || 'application/xml',
                'Access-Control-Allow-Origin': '*',
                'X-Cache': 'HIT',
                'X-Cache-Age': String(Math.floor((now - data.timestamp) / 1000)),
                'X-Cache-TTL': String(Math.floor((CACHE_TTL - (now - data.timestamp)) / 1000)),
              },
            });
          }
        }
      } catch (e) {
        console.error('KV get error:', e);
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
      }
    }

    // 记录强制刷新时间
    if (forceRefresh) {
      await recordForceRefresh(clientIP);
    }

    return new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'MISS',
        ...(forceRefresh && { 'X-Force-Refresh': 'true' }),
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
