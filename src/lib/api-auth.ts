const API_SECRET_KEY = import.meta.env.VITE_API_SECRET_KEY || '';

const TIMESTAMP_TOLERANCE = 5 * 60 * 1000;

interface AuthHeaders {
  'X-Timestamp': string;
  'X-Nonce': string;
  'X-Signature': string;
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

async function generateSignature(message: string): Promise<string> {
  if (!API_SECRET_KEY) {
    throw new Error('API_SECRET_KEY is not configured');
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(API_SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  );

  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generateAuthHeaders(): Promise<AuthHeaders> {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomUUID();
  const message = `${timestamp}:${nonce}`;
  
  const signature = await generateSignature(message);
  
  return {
    'X-Timestamp': timestamp,
    'X-Nonce': nonce,
    'X-Signature': signature,
  };
}

export function validateSecretKey(): boolean {
  if (!API_SECRET_KEY) {
    console.error('API_SECRET_KEY is not configured in environment variables');
    return false;
  }
  
  if (API_SECRET_KEY.length < 64) {
    console.error('API_SECRET_KEY should be at least 32 bytes (64 hex characters)');
    return false;
  }
  
  return true;
}

export function getTimestampTolerance(): number {
  return TIMESTAMP_TOLERANCE;
}
