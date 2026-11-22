/**
 * EdgeOne Pages Edge Function for lyrics.
 * Route: /api/lyric?name=<encoded .lrc filename>
 *
 * The media mirror (music.sakurain.net) does not send
 * Access-Control-Allow-Origin, so a browser cannot read its LRC files
 * directly. This function fetches the file at the edge and returns it from
 * the site's own origin.
 */

const DEFAULT_MUSIC_BASE = 'https://music.sakurain.net/music';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function textResponse(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

export default async function onRequest(context) {
  const request = context.request;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (request.method !== 'GET') {
    return textResponse('Method not allowed', 405, { Allow: 'GET, OPTIONS' });
  }

  const url = new URL(request.url);
  const name = url.searchParams.get('name');
  if (
    !name ||
    !name.toLowerCase().endsWith('.lrc') ||
    name.includes('/') ||
    name.includes('\\') ||
    name.includes('..') ||
    name.length > 300
  ) {
    return textResponse('Invalid lyric name', 400);
  }

  const base = String(context.env?.MUSIC_CDN_BASE_URL || DEFAULT_MUSIC_BASE).replace(
    /\/$/,
    ''
  );
  const upstream = `${base}/lyric/${encodeURIComponent(name)}`;

  try {
    const upstreamResponse = await fetch(upstream, {
      headers: { Accept: 'text/plain, application/octet-stream;q=0.9' },
    });
    if (!upstreamResponse.ok) {
      return textResponse('Lyric not found', upstreamResponse.status === 404 ? 404 : 502);
    }

    const text = await upstreamResponse.text();
    if (!/\[\d{1,3}:\d{2}(?:[.:]\d{1,3})?\]/.test(text)) {
      return textResponse('Invalid lyric payload', 502);
    }
    return textResponse(text);
  } catch {
    return textResponse('Lyric fetch failed', 502);
  }
}
