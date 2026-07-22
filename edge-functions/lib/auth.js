/**
 * Authentication helpers for EdgeOne Pages Edge Functions.
 *
 * Provides HMAC-SHA256 request signing (timestamp + nonce), CORS headers,
 * and security headers required by project rules.
 */

const TIMESTAMP_TOLERANCE = 5 * 60 * 1000;
const NONCE_TTL = 300;

/** Security headers required for all edge API responses. */
export const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

/**
 * Generate a random nonce string.
 * @returns {string}
 */
export function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Build CORS headers including required security headers.
 * @returns {Record<string, string>}
 */
export function createCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, X-Timestamp, X-Nonce, X-Signature, Authorization',
    'Access-Control-Max-Age': '86400',
    ...SECURITY_HEADERS,
  };
}

/**
 * Add CORS and security headers to an existing response.
 * @param {Response} response
 * @returns {Response}
 */
export function addCorsHeaders(response) {
  const headers = new Headers(response.headers);
  Object.entries(createCorsHeaders()).forEach(([key, value]) => {
    headers.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Create a CORS preflight response.
 * @param {string} allowedMethods
 * @returns {Response}
 */
export function handleCorsPreflight(allowedMethods) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': allowedMethods,
      'Access-Control-Allow-Headers':
        'Content-Type, X-Timestamp, X-Nonce, X-Signature, Authorization',
      ...SECURITY_HEADERS,
    },
  });
}

/**
 * Sign a payload with HMAC-SHA256.
 * @param {string} secretKey
 * @param {string} payload
 * @returns {Promise<string>} Hex signature.
 */
async function hmacSign(secretKey, payload) {
  const keyData = new TextEncoder().encode(secretKey);
  const messageData = new TextEncoder().encode(payload);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify X-Timestamp / X-Nonce / X-Signature headers.
 * @param {Request} request
 * @param {Record<string, string>} env
 * @returns {Promise<{ok: boolean; error?: string; timestamp?: string; nonce?: string}>}
 */
export async function verifyAuthHeaders(request, env) {
  const secretKey = env.API_SECRET_KEY;
  if (!secretKey) {
    return { ok: false, error: 'API_SECRET_KEY is not configured' };
  }

  const timestamp = request.headers.get('X-Timestamp') || '';
  const nonce = request.headers.get('X-Nonce') || '';
  const signature = request.headers.get('X-Signature') || '';

  if (!timestamp || !nonce || !signature) {
    return { ok: false, error: 'Missing auth headers', timestamp, nonce };
  }

  const requestTime = parseInt(timestamp, 10);
  if (Number.isNaN(requestTime)) {
    return { ok: false, error: 'Invalid timestamp', timestamp, nonce };
  }

  const now = Date.now();
  if (Math.abs(now - requestTime) > TIMESTAMP_TOLERANCE) {
    return { ok: false, error: 'Timestamp out of tolerance', timestamp, nonce };
  }

  const kv = env.NONCE_KV;
  if (kv) {
    const nonceKey = `nonce:${nonce}`;
    const existing = await kv.get(nonceKey);
    if (existing) {
      return { ok: false, error: 'Nonce reused', timestamp, nonce };
    }
    await kv.put(nonceKey, timestamp, { expirationTtl: NONCE_TTL });
  }

  // Align signing payload with the client (src/lib/api-auth.ts) so that
  // comments, danmaku, and any other authenticated edge APIs share one scheme.
  const payload = `${timestamp}:${nonce}`;
  const expected = await hmacSign(secretKey, payload);

  if (
    signature.length !== expected.length ||
    !crypto.subtle.timingSafeEqual(
      new Uint8Array(
        signature.match(/.{1,2}/g).map((b) => parseInt(b, 16))
      ),
      new Uint8Array(
        expected.match(/.{1,2}/g).map((b) => parseInt(b, 16))
      )
    )
  ) {
    return { ok: false, error: 'Invalid signature', timestamp, nonce };
  }

  return { ok: true, timestamp, nonce };
}

/**
 * Create a JSON response for authentication errors.
 * @param {{error: string; timestamp?: string; nonce?: string}} result
 * @returns {Response}
 */
export function createAuthErrorResponse(result) {
  return new Response(
    JSON.stringify({
      error: result.error,
      timestamp: result.timestamp,
      nonce: result.nonce,
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        ...SECURITY_HEADERS,
      },
    }
  );
}
