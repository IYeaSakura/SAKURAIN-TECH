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

    if (!body.text) {
      return addCorsHeaders(
        new Response(JSON.stringify({ error: 'Missing text' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    }

    const text = String(body.text).trim();
    if (!text || text.length > 15) {
      return addCorsHeaders(
        new Response(JSON.stringify({ error: 'Invalid text length' }), {
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

    let markdown = '';
    if (body.markdown) {
      const md = String(body.markdown).trim();
      if (md && md.length <= 300) {
        markdown = md;
      }
    }

    const danmakuId = body.id || ('d' + Date.now());
    
    const newDanmaku = {
      id: danmakuId,
      text: text,
      userId: String(body.userId || 'anon'),
      timestamp: Date.now(),
      color: String(body.color || '#60a5fa'),
      orbitType: String(body.orbitType || 'medium'),
      angle: body.angle != null ? body.angle : Math.random() * Math.PI * 2,
      inclination: body.inclination != null ? body.inclination : (Math.random() - 0.5) * Math.PI / 1.5,
      altitude: body.altitude != null ? body.altitude : (2000000 + Math.random() * 1000000),
      speed: body.speed != null ? body.speed : (2 + Math.random()),
      raan: body.raan != null ? body.raan : Math.random() * Math.PI * 2,
      markdown: markdown,
    };

    danmakus.push(newDanmaku);
    if (danmakus.length > 256) {
      danmakus.shift();
    }

    await kv.put('danmakus', JSON.stringify(danmakus));

    return addCorsHeaders(
      new Response(JSON.stringify({ success: true, danmaku: newDanmaku }), {
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
