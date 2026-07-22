import { addCorsHeaders } from '../../auth.js';
import { checkRateLimit, createRateLimitResponse } from '../../rate-limit.js';

export async function onRequestGet(context) {
  try {
    const rateLimitResult = await checkRateLimit(context.request);

    if (!rateLimitResult.allowed) {
      return addCorsHeaders(createRateLimitResponse(rateLimitResult));
    }

    const kv = DANMAKU_KV;

    if (!kv) {
      return addCorsHeaders(
        new Response(JSON.stringify({
          error: 'KV not bound',
          hasDANMAKU_KV: typeof DANMAKU_KV !== 'undefined',
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    }

    const data = await kv.get('danmakus');
    let danmakus = [];
    if (data) {
      try {
        danmakus = JSON.parse(data);
      } catch (e) {
        danmakus = [];
      }
    }

    return addCorsHeaders(
      new Response(JSON.stringify(danmakus), {
        headers: { 'Content-Type': 'application/json' },
      })
    );
  } catch (err) {
    return addCorsHeaders(
      new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
