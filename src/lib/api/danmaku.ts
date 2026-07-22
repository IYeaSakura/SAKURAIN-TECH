/**
 * Danmaku business logic for edge Route Handlers.
 * Backed by DANMAKU_KV; list is public, add/delete require HMAC auth.
 */

declare global {
  var DANMAKU_KV: KVNamespace | undefined;
}

import {
  verifyAuthHeaders,
  createAuthErrorResponse,
  addCorsHeaders,
} from './auth';
import { checkRateLimit, createRateLimitResponse } from './rate-limit';

export interface Danmaku {
  id: string;
  text: string;
  userId: string;
  timestamp: number;
  color: string;
  orbitType: string;
  angle: number;
  inclination: number;
  altitude: number;
  speed: number;
  raan: number;
  markdown: string;
}

function createCorsPreflightResponse(allowedMethods: string): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': allowedMethods,
      'Access-Control-Allow-Headers': 'Content-Type, X-Timestamp, X-Nonce, X-Signature',
    },
  });
}

async function getDanmakus(): Promise<Danmaku[]> {
  const kv = globalThis.DANMAKU_KV;
  if (!kv) {
    return [];
  }
  const data = await kv.get('danmakus');
  if (!data) {
    return [];
  }
  try {
    return JSON.parse(data) as Danmaku[];
  } catch {
    return [];
  }
}

async function saveDanmakus(danmakus: Danmaku[]): Promise<void> {
  const kv = globalThis.DANMAKU_KV;
  if (!kv) {
    throw new Error('KV not bound');
  }
  await kv.put('danmakus', JSON.stringify(danmakus));
}

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Shared handler for add/delete routes: applies rate limiting and auth,
 * then delegates to the provided callback.
 */
async function handleMutatingRequest(
  request: Request,
  callback: (body: Record<string, unknown>, danmakus: Danmaku[]) => Promise<Response> | Response
): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return createCorsPreflightResponse('POST, OPTIONS');
  }

  const rateLimitResult = await checkRateLimit(request);
  if (!rateLimitResult.allowed) {
    return addCorsHeaders(createRateLimitResponse(rateLimitResult));
  }

  const authResult = await verifyAuthHeaders(request.headers);
  if (!authResult.success) {
    return addCorsHeaders(createAuthErrorResponse(authResult));
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return addCorsHeaders(createJsonResponse({ error: 'Bad JSON' }, 400));
  }

  const kv = globalThis.DANMAKU_KV;
  if (!kv) {
    return addCorsHeaders(createJsonResponse({ error: 'KV not bound' }, 500));
  }

  const danmakus = await getDanmakus();
  return addCorsHeaders(await callback(body, danmakus));
}

export async function handleList(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return createCorsPreflightResponse('GET, OPTIONS');
  }

  const rateLimitResult = await checkRateLimit(request);
  if (!rateLimitResult.allowed) {
    return addCorsHeaders(createRateLimitResponse(rateLimitResult));
  }

  const kv = globalThis.DANMAKU_KV;
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

  const danmakus = await getDanmakus();
  return addCorsHeaders(createJsonResponse(danmakus));
}

export async function handleAdd(request: Request): Promise<Response> {
  return handleMutatingRequest(request, (body, danmakus) => {
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

    const newDanmaku: Danmaku = {
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
    if (danmakus.length > 256) {
      danmakus.shift();
    }

    // Fire-and-forget KV write; return response immediately.
    saveDanmakus(danmakus).catch((err) => {
      console.error('Failed to save danmaku:', err);
    });

    return createJsonResponse({ success: true, danmaku: newDanmaku });
  });
}

export async function handleDelete(request: Request): Promise<Response> {
  return handleMutatingRequest(request, (body, danmakus) => {
    if (!body.id) {
      return createJsonResponse({ error: 'Missing id' }, 400);
    }

    const id = String(body.id);
    const filtered = danmakus.filter((d) => d.id !== id);

    saveDanmakus(filtered).catch((err) => {
      console.error('Failed to delete danmaku:', err);
    });

    return createJsonResponse({ success: true });
  });
}
