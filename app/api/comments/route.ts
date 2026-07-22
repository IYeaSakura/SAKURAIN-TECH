/**
 * Comments API Route Handler (edge runtime).
 * Replaces the legacy edge-functions/api/comments/index.js explicit handler.
 */

export const runtime = 'edge';

import { handleRequest } from '@/lib/api/comments';

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}

export async function OPTIONS() {
  // CORS preflight is handled inside handleRequest; provide a fallback here.
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Timestamp, X-Nonce, X-Signature',
    },
  });
}
