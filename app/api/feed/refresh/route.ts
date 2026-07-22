/**
 * Single feed refresh API Route Handler (edge runtime).
 * Replaces edge-functions/api/feed/refresh.js.
 */

export const runtime = 'edge';

import { handleRefresh } from '@/lib/api/feed';

export async function GET(request: Request) {
  return handleRefresh(request);
}

export async function OPTIONS(request: Request) {
  return handleRefresh(request);
}
