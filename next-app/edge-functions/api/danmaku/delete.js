import { verifyAuthHeaders, createAuthErrorResponse, addCorsHeaders } from '../../auth.js';
import { checkRateLimit, createRateLimitResponse } from '../../rate-limit.js';

export async function onRequestPost(context) {
  try {
    const rateLimitResult = await checkRateLimit(context.request);

    if (!rateLimitResult.allowed) {
      return addCorsHeaders(createRateLimitResponse(rateLimitResult));
    }

    const authResult = await verifyAuthHeaders(context.request.headers, context.env);

    if (!authResult.success) {
      return addCorsHeaders(createAuthErrorResponse(authResult));
    }

    let body = {};
    try {
      body = await context.request.json();
    } catch (e) {
      return addCorsHeaders(
        new Response(JSON.stringify({ error: 'Bad JSON' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    }

    if (!body.id) {
      return addCorsHeaders(
        new Response(JSON.stringify({ error: 'Missing id' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    }

    const kv = DANMAKU_KV;
    if (!kv) {
      return addCorsHeaders(
        new Response(JSON.stringify({ error: 'KV not bound' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    }

    let danmakus = [];
    const data = await kv.get('danmakus');
    if (data) {
      try {
        danmakus = JSON.parse(data);
      } catch (e) {
        danmakus = [];
      }
    }

    const filtered = danmakus.filter(function(d) {
      return d.id !== body.id;
    });

    await kv.put('danmakus', JSON.stringify(filtered));

    return addCorsHeaders(
      new Response(JSON.stringify({ success: true }), {
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Timestamp, X-Nonce, X-Signature'
    }
  });
}
