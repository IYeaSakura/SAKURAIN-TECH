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
 * - 刷新失败时标记该源不可访问，get接口将跳过自动刷新
 *
 * 速率限制:
 * - 每IP每60秒只能调用一次（针对每个URL独立限制）
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
    // Check if already marked, increment attempts
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
    console.log(`[Feed Refresh] Marked source as failed: ${feedUrl} (attempt ${attempts})`);
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
    console.log(`[Feed Refresh] Cleared failed mark for: ${feedUrl}`);
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

// 检查强制刷新冷却时间
async function checkForceRefreshLimit(ip, feedUrl) {
  const key = `feed:force:${ip}:${feedUrl}`;
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
async function recordForceRefresh(ip, feedUrl) {
  const key = `feed:force:${ip}:${feedUrl}`;
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
    
    console.log(`[Feed Refresh] Force refresh request for: ${feedUrl} from IP: ${clientIP}`);

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

    // 检查强制刷新冷却时间（针对每个URL独立限制）
    const forceLimit = await checkForceRefreshLimit(clientIP, feedUrl);
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
    console.log(`[Feed Refresh] Fetching from source: ${feedUrl}`);
    
    const kv = FEED_KV;
    
    try {
      const feedResponse = await fetch(feedUrl, {
        method: 'GET',
        headers: buildBrowserHeaders(),
      });

      if (!feedResponse.ok) {
        // Mark as failed source
        const errorMsg = `Failed to fetch feed: HTTP ${feedResponse.status}`;
        await markSourceFailed(kv, feedUrl, errorMsg);
        
        return new Response(JSON.stringify({
          error: errorMsg,
          status: feedResponse.status,
          markedAsFailed: true,
        }), {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-Feed-Failed': 'true',
          },
        });
      }

      const content = await feedResponse.text();
      const contentType = feedResponse.headers.get('content-type') || 'application/xml';
      console.log(`[Feed Refresh] Fetched ${content.length} bytes, Content-Type: ${contentType}`);

      // Check if content looks like valid RSS/Atom feed
      const isValidFeed = content.includes('<rss') || 
                          content.includes('<feed') || 
                          content.includes('<?xml') ||
                          content.includes('"items"') ||
                          content.includes('"entries"');
      
      if (!isValidFeed) {
        // Content doesn't look like a valid feed, mark as failed
        const errorMsg = 'Invalid feed format: response is not a valid RSS/Atom feed';
        await markSourceFailed(kv, feedUrl, errorMsg);
        
        return new Response(JSON.stringify({
          error: errorMsg,
          markedAsFailed: true,
        }), {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-Feed-Failed': 'true',
          },
        });
      }

      // 保存到 KV 缓存
      const cacheKey = `feed:${feedUrl}`;
      const currentTimestamp = Date.now();

      if (kv) {
        try {
          await kv.put(cacheKey, JSON.stringify({
            content,
            contentType,
            timestamp: currentTimestamp,
          }));
          console.log(`[Feed Refresh] Successfully saved to KV: ${cacheKey}`);
          
          // Clear failed mark since source is now accessible
          await clearFailedMark(kv, feedUrl);
        } catch (e) {
          console.error(`[Feed Refresh] KV put error for ${cacheKey}:`, e);
        }
      } else {
        console.warn(`[Feed Refresh] KV not available, cache not saved`);
      }

      // 记录强制刷新时间（针对每个URL独立记录）
      await recordForceRefresh(clientIP, feedUrl);

      return new Response(content, {
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'X-Cache': 'MISS',
          'X-Feed-Timestamp': currentTimestamp.toString(),
          'X-Force-Refresh': 'true',
        },
      });
    } catch (fetchErr) {
      // Mark as failed source
      const errorMsg = String(fetchErr);
      await markSourceFailed(kv, feedUrl, errorMsg);
      
      console.error(`[Feed Refresh] Fetch error for ${feedUrl}:`, fetchErr);
      return new Response(JSON.stringify({ 
        error: errorMsg,
        markedAsFailed: true,
      }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Feed-Failed': 'true',
        },
      });
    }

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