/**
 * Batch feed cache query API Route Handler (edge runtime).
 * Replaces edge-functions/api/feed/batch-get.js.
 */

export const runtime = 'edge';

import { handleBatchGet } from '@/lib/api/feed';

export async function GET(request: Request) {
  return handleBatchGet(request);
}

export async function OPTIONS(request: Request) {
  return handleBatchGet(request);
}
