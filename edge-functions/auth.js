const TIMESTAMP_TOLERANCE = 5 * 60 * 1000;
const NONCE_TTL = 300;

function hexToUint8Array(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

async function verifySignature(message, signature, secretKey) {
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

  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    hexToUint8Array(signature),
    encoder.encode(message)
  );

  return isValid;
}

export async function verifyAuthHeaders(headers, env) {
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

  if (isNaN(timestampNum)) {
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

  const nonceKey = `nonce:${nonce}`;
  const usedNonce = await env.KV_SECRET.get(nonceKey);

  if (usedNonce) {
    return {
      success: false,
      error: 'Nonce already used',
      nonce,
    };
  }

  const message = `${timestamp}:${nonce}`;
  const isValid = await verifySignature(message, signature, env.VITE_API_SECRET_KEY);

  if (!isValid) {
    return {
      success: false,
      error: 'Invalid signature',
      timestamp,
      nonce,
    };
  }

  await env.KV_SECRET.put(nonceKey, '1', {
    expirationTtl: NONCE_TTL,
  });

  return {
    success: true,
    timestamp,
    nonce,
  };
}

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
      },
    }
  );
}

export function createCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Timestamp, X-Nonce, X-Signature, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function handleCorsPreflight() {
  return new Response(null, {
    status: 204,
    headers: createCorsHeaders(),
  });
}

export function addCorsHeaders(response) {
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
