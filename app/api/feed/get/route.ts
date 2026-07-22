/**
 * Single feed fetch API Route Handler (edge runtime).
 * Replaces edge-functions/api/feed/get.js.
 */

export const runtime = 'edge';

import { handleGet } from '@/lib/api/feed';

export async function GET(request: Request) {
  return handleGet(request);
}

export async function OPTIONS(request: Request) {
  return handleGet(request);
}
