/**
 * Danmaku add API Route Handler (edge runtime).
 * Requires HMAC authentication; mutates DANMAKU_KV.
 */

export const runtime = 'edge';

import { handleAdd } from '@/lib/api/danmaku';

export async function POST(request: Request) {
  return handleAdd(request);
}

export async function OPTIONS(request: Request) {
  return handleAdd(request);
}
