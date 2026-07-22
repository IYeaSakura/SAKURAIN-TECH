/**
 * Batch feed refresh API Route Handler (edge runtime).
 * Replaces edge-functions/api/feed/batch-refresh.js.
 */

export const runtime = 'edge';

import { handleBatchRefresh } from '@/lib/api/feed';

export async function POST(request: Request) {
  return handleBatchRefresh(request);
}

export async function OPTIONS(request: Request) {
  return handleBatchRefresh(request);
}
