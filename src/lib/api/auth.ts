/**
 * Server-side authentication helpers for edge Route Handlers.
 * Provides HMAC-SHA256 header verification, nonce replay protection via KV_SECRET,
 * and CORS utilities matching the legacy edge-functions behaviour.
 */

const TIMESTAMP_TOLERANCE = 5 * 60 * 1000;
const NONCE_TTL = 300;

/**
 * Security headers required for all edge API responses.
 * Applied by response helpers to satisfy project security rules.
 */
export const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

/**
 * EdgeOne KV namespaces are injected as global variables.
 * Type them here so consumers do not need to redeclare them.
 */
declare global {
  var KV_SECRET: KVNamespace | undefined;
}

function hexToUint8Array(hex: string): Uint8Array<ArrayBuffer> {
  // Back the view with a plain ArrayBuffer to satisfy strict DOM typings
  // (crypto.subtle.verify expects ArrayBufferView<ArrayBuffer>).
  const buffer = new ArrayBuffer(hex.length / 2);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function verifySignature(
  message: string,
  signature: string,
  secretKey: string
): Promise<boolean> {
  if (!signature) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  return crypto.subtle.verify(
    'HMAC',
    key,
    hexToUint8Array(signature),
    encoder.encode(message)
  );
}

export interface AuthVerifyResult {
  success: boolean;
  error?: string;
  timestamp?: string;
  nonce?: string;
}

/**
 * Verify X-Timestamp / X-Nonce / X-Signature headers.
 * Reads the secret from process.env.API_SECRET_KEY.
 */
export async function verifyAuthHeaders(headers: Headers): Promise<AuthVerifyResult> {
  const timestamp = headers.get('X-Timestamp');
  const nonce = headers.get('X-Nonce');
  const signature = headers.get('X-Signature');

  if (!timestamp || !nonce || !signature) {
    return {
      success: false,
      error: 'Missing required headers: X-Timestamp, X-Nonce, X-Signature',
    };
  }

  const now = Date.now();
  const timestampNum = parseInt(timestamp, 10);

  if (Number.isNaN(timestampNum)) {
    return {
      success: false,
      error: 'Invalid timestamp format',
    };
  }

  if (Math.abs(now - timestampNum) > TIMESTAMP_TOLERANCE) {
    return {
      success: false,
      error: `Timestamp expired. Tolerance: ${TIMESTAMP_TOLERANCE}ms`,
      timestamp,
    };
  }

  const kv = globalThis.KV_SECRET;
  if (kv) {
    const nonceKey = `nonce:${nonce}`;
    const usedNonce = await kv.get(nonceKey);

    if (usedNonce) {
      return {
        success: false,
        error: 'Nonce already used',
        nonce,
      };
    }
  }

  const secretKey = process.env.API_SECRET_KEY;
  if (!secretKey) {
    return {
      success: false,
      error: 'Server secret key not configured',
    };
  }

  const message = `${timestamp}:${nonce}`;
  const isValid = await verifySignature(message, signature, secretKey);

  if (!isValid) {
    return {
      success: false,
      error: 'Invalid signature',
      timestamp,
      nonce,
    };
  }

  if (kv) {
    await kv.put(`nonce:${nonce}`, '1', {
      expirationTtl: NONCE_TTL,
    });
  }

  return {
    success: true,
    timestamp,
    nonce,
  };
}

export function createAuthErrorResponse(result: AuthVerifyResult): Response {
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

export function createCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, X-Timestamp, X-Nonce, X-Signature, Authorization',
    'Access-Control-Max-Age': '86400',
    ...SECURITY_HEADERS,
  };
}

export function handleCorsPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: createCorsHeaders(),
  });
}

export function addCorsHeaders(response: Response): Response {
  const corsHeaders = createCorsHeaders();
  const newHeaders = new Headers(response.headers);

  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
