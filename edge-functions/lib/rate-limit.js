/**
 * Simple per-IP rate limiting backed by EdgeOne KV.
 */

import { SECURITY_HEADERS } from './auth.js';
import { getKV } from './kv.js';

const RATE_LIMIT_WINDOW = 60; // seconds
const RATE_LIMIT_MAX_REQUESTS = 30;

/**
 * Check whether the client IP has exceeded the rate limit.
 * @param {Request} request
 * @param {Record<string, any>} env
 * @param {string} [namespace="RATE_LIMIT_KV"]
 * @returns {Promise<{ok: boolean; remaining?: number; reset?: number}>}
 */
export async function checkRateLimit(request, env, namespace = 'RATE_LIMIT_KV') {
  const kv = getKV(namespace, env);
  if (!kv) {
    // No KV binding means rate limiting is disabled.
    return { ok: true };
  }

  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
  const key = `rate-limit:${clientIp}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / RATE_LIMIT_WINDOW) * RATE_LIMIT_WINDOW;

  try {
    const data = await kv.get(key, 'json');
    const record = data || { count: 0, window: windowStart };

    if (record.window !== windowStart) {
      record.count = 0;
      record.window = windowStart;
    }

    record.count += 1;

    const ttl = RATE_LIMIT_WINDOW * 2;
    await kv.put(key, JSON.stringify(record), { expirationTtl: ttl });

    if (record.count > RATE_LIMIT_MAX_REQUESTS) {
      return {
        ok: false,
        remaining: 0,
        reset: windowStart + RATE_LIMIT_WINDOW,
      };
    }

    return {
      ok: true,
      remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - record.count),
      reset: windowStart + RATE_LIMIT_WINDOW,
    };
  } catch (err) {
    console.error('Rate limit check failed:', err);
    return { ok: true };
  }
}

/**
 * Create a 429 Too Many Requests response.
 * @param {{reset: number}} limit
 * @returns {Response}
 */
export function createRateLimitResponse(limit) {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      retryAfter: Math.max(1, limit.reset - Math.floor(Date.now() / 1000)),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.max(1, limit.reset - Math.floor(Date.now() / 1000))),
        ...SECURITY_HEADERS,
      },
    }
  );
}
