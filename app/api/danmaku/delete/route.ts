/**
 * Danmaku delete API Route Handler (edge runtime).
 * Requires HMAC authentication; mutates DANMAKU_KV.
 */

export const runtime = 'edge';

import { handleDelete } from '@/lib/api/danmaku';

export async function POST(request: Request) {
  return handleDelete(request);
}

export async function OPTIONS(request: Request) {
  return handleDelete(request);
}
