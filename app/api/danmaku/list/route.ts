/**
 * Danmaku list API Route Handler (edge runtime).
 * Public read endpoint backed by DANMAKU_KV.
 */

export const runtime = 'edge';

import { handleList } from '@/lib/api/danmaku';

export async function GET(request: Request) {
  return handleList(request);
}

export async function OPTIONS(request: Request) {
  return handleList(request);
}
