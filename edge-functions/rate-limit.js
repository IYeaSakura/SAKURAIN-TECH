const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;

export async function checkRateLimit(request) {
  const ip = getClientIP(request);
  
  if (!ip) {
    return { allowed: true };
  }

  const key = `ratelimit:${ip}`;
  const data = await RATE_LIMIT_KV.get(key);

  if (!data) {
    await RATE_LIMIT_KV.put(key, JSON.stringify({
      count: 1,
      resetAt: Date.now() + RATE_LIMIT_WINDOW,
    }), {
      expirationTtl: Math.ceil(RATE_LIMIT_WINDOW / 1000),
    });

    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  const record = JSON.parse(data);
  const now = Date.now();

  if (now >= record.resetAt) {
    await RATE_LIMIT_KV.put(key, JSON.stringify({
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    }), {
      expirationTtl: Math.ceil(RATE_LIMIT_WINDOW / 1000),
    });

    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    const resetIn = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      error: 'Rate limit exceeded',
      resetIn,
      limit: RATE_LIMIT_MAX_REQUESTS,
      window: RATE_LIMIT_WINDOW / 1000,
    };
  }

  record.count += 1;
  await RATE_LIMIT_KV.put(key, JSON.stringify(record), {
    expirationTtl: Math.ceil((record.resetAt - now) / 1000),
  });

  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
}

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

  return null;
}

export function createRateLimitResponse(result) {
  return new Response(
    JSON.stringify({
      error: result.error,
      limit: result.limit,
      window: result.window,
      resetIn: result.resetIn,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': result.resetIn?.toString() || '60',
        'X-RateLimit-Limit': result.limit?.toString() || '60',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': (Date.now() + (result.resetIn || 60) * 1000).toString(),
      },
    }
  );
}
