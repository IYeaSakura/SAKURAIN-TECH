/**
 * Per-IP sliding-window rate limiter backed by RATE_LIMIT_KV.
 * Mirrors the legacy edge-functions rate-limit logic for the edge runtime.
 */

declare global {
  var RATE_LIMIT_KV: KVNamespace | undefined;
}

const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;

export interface RateLimitResult {
  allowed: boolean;
  error?: string;
  remaining?: number;
  resetIn?: number;
  limit?: number;
  window?: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export function getClientIP(request: Request): string | null {
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

export async function checkRateLimit(request: Request): Promise<RateLimitResult> {
  const ip = getClientIP(request);

  if (!ip) {
    return { allowed: true };
  }

  const kv = globalThis.RATE_LIMIT_KV;
  const key = `ratelimit:${ip}`;
  const data = kv ? await kv.get(key) : null;
  const now = Date.now();

  if (!data) {
    if (kv) {
      await kv.put(
        key,
        JSON.stringify({
          count: 1,
          resetAt: now + RATE_LIMIT_WINDOW,
        } as RateLimitRecord),
        {
          expirationTtl: Math.ceil(RATE_LIMIT_WINDOW / 1000),
        }
      );
    }

    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  const record = JSON.parse(data) as RateLimitRecord;

  if (now >= record.resetAt) {
    if (kv) {
      await kv.put(
        key,
        JSON.stringify({
          count: 1,
          resetAt: now + RATE_LIMIT_WINDOW,
        } as RateLimitRecord),
        {
          expirationTtl: Math.ceil(RATE_LIMIT_WINDOW / 1000),
        }
      );
    }

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
  if (kv) {
    await kv.put(key, JSON.stringify(record), {
      expirationTtl: Math.ceil((record.resetAt - now) / 1000),
    });
  }

  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
}

export function createRateLimitResponse(result: RateLimitResult): Response {
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
