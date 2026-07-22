/**
 * Danmaku business logic for EdgeOne Pages Edge Functions.
 * Backed by DANMAKU_KV; list is public, add/delete require HMAC auth.
 */

import {
  verifyAuthHeaders,
  createAuthErrorResponse,
  addCorsHeaders,
  handleCorsPreflight,
  SECURITY_HEADERS,
} from './auth.js';
import { checkRateLimit, createRateLimitResponse } from './rate-limit.js';
import { getKV } from './kv.js';

const MAX_DANMAKU_COUNT = 256;

async function getDanmakus(env) {
  const kv = getKV('DANMAKU_KV', env);
  if (!kv) {
    return [];
  }
  const data = await kv.get('danmakus');
  if (!data) {
    return [];
  }
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveDanmakus(danmakus, env) {
  const kv = getKV('DANMAKU_KV', env);
  if (!kv) {
    throw new Error('KV not bound');
  }
  await kv.put('danmakus', JSON.stringify(danmakus));
}

function createJsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...SECURITY_HEADERS,
    },
  });
}

async function handleMutatingRequest(request, env, callback) {
  if (request.method === 'OPTIONS') {
    return handleCorsPreflight('POST, OPTIONS');
  }

  const rateLimitResult = await checkRateLimit(request, env);
  if (!rateLimitResult.ok) {
    return addCorsHeaders(createRateLimitResponse(rateLimitResult));
  }

  const authResult = await verifyAuthHeaders(request, env);
  if (!authResult.ok) {
    return addCorsHeaders(createAuthErrorResponse(authResult));
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return addCorsHeaders(createJsonResponse({ error: 'Bad JSON' }, 400));
  }

  const kv = getKV('DANMAKU_KV', env);
  if (!kv) {
    return addCorsHeaders(createJsonResponse({ error: 'KV not bound' }, 500));
  }

  const danmakus = await getDanmakus(env);
  return addCorsHeaders(await callback(body, danmakus, env));
}

export async function handleList(request, env) {
  if (request.method === 'OPTIONS') {
    return handleCorsPreflight('GET, OPTIONS');
  }

  const rateLimitResult = await checkRateLimit(request, env);
  if (!rateLimitResult.ok) {
    return addCorsHeaders(createRateLimitResponse(rateLimitResult));
  }

  const kv = getKV('DANMAKU_KV', env);
  if (!kv) {
    return addCorsHeaders(
      createJsonResponse(
        {
          error: 'KV not bound',
          hasDANMAKU_KV: typeof globalThis.DANMAKU_KV !== 'undefined',
        },
        500
      )
    );
  }

  const danmakus = await getDanmakus(env);
  return addCorsHeaders(createJsonResponse(danmakus));
}

export async function handleAdd(request, env) {
  return handleMutatingRequest(request, env, (body, danmakus) => {
    if (!body.text) {
      return createJsonResponse({ error: 'Missing text' }, 400);
    }

    const text = String(body.text).trim();
    if (!text || text.length > 15) {
      return createJsonResponse({ error: 'Invalid text length' }, 400);
    }

    let markdown = '';
    if (body.markdown) {
      const md = String(body.markdown).trim();
      if (md && md.length <= 300) {
        markdown = md;
      }
    }

    const danmakuId = body.id ? String(body.id) : `d${Date.now()}`;

    const newDanmaku = {
      id: danmakuId,
      text,
      userId: String(body.userId || 'anon'),
      timestamp: Date.now(),
      color: String(body.color || '#60a5fa'),
      orbitType: String(body.orbitType || 'medium'),
      angle: body.angle != null ? Number(body.angle) : Math.random() * Math.PI * 2,
      inclination:
        body.inclination != null
          ? Number(body.inclination)
          : (Math.random() - 0.5) * Math.PI / 1.5,
      altitude:
        body.altitude != null
          ? Number(body.altitude)
          : 2000000 + Math.random() * 1000000,
      speed: body.speed != null ? Number(body.speed) : 2 + Math.random(),
      raan: body.raan != null ? Number(body.raan) : Math.random() * Math.PI * 2,
      markdown,
    };

    danmakus.push(newDanmaku);
    if (danmakus.length > MAX_DANMAKU_COUNT) {
      danmakus.shift();
    }

    saveDanmakus(danmakus, env).catch((err) => {
      console.error('Failed to save danmaku:', err);
    });

    return createJsonResponse({ success: true, danmaku: newDanmaku });
  });
}

export async function handleDelete(request, env) {
  return handleMutatingRequest(request, env, (body, danmakus) => {
    if (!body.id) {
      return createJsonResponse({ error: 'Missing id' }, 400);
    }

    const id = String(body.id);
    const filtered = danmakus.filter((d) => d.id !== id);

    saveDanmakus(filtered, env).catch((err) => {
      console.error('Failed to delete danmaku:', err);
    });

    return createJsonResponse({ success: true });
  });
}
