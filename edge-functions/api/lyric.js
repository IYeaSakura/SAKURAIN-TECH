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

// Only these media hosts may be proxied, which prevents the endpoint from
// becoming an open SSRF relay.
const ALLOWED_LYRIC_HOSTS = new Set([
  'music.sakurain.net',
  'cos.sakurain.net',
  'file.sakurain.net',
]);

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
  const rawUrl = url.searchParams.get('url');
  const name = url.searchParams.get('name');
  const candidates = [];

  // Preferred: proxy the exact lyricUrl stored in playlist.json, the same URL
  // the browser already uses for audio and cover art.
  if (rawUrl) {
    let target;
    try {
      target = new URL(rawUrl);
    } catch {
      target = null;
    }
    if (
      !target ||
      target.protocol !== 'https:' ||
      target.username ||
      target.password ||
      !ALLOWED_LYRIC_HOSTS.has(target.hostname.toLowerCase()) ||
      !/\.lrc$/i.test(target.pathname)
    ) {
      return textResponse('Invalid lyric url', 400);
    }
    candidates.push(target.toString());
  }

  if (
    name &&
    name.toLowerCase().endsWith('.lrc') &&
    !name.includes('/') &&
    !name.includes('\\') &&
    !name.includes('..') &&
    name.length <= 300
  ) {
    const base = String(context.env?.MUSIC_CDN_BASE_URL || DEFAULT_MUSIC_BASE).replace(
      /\/$/,
      ''
    );
    const encodedName = encodeURIComponent(name);
    // MUSIC_CDN_BASE_URL may be configured with or without the /music prefix.
    // Try both layouts so a deployment misconfiguration cannot break lyrics.
    candidates.push(
      `${base}/lyric/${encodedName}`,
      `${base}/music/lyric/${encodedName}`,
      `${base.replace(/\/music$/i, '')}/lyric/${encodedName}`
    );
  }

  if (candidates.length === 0) {
    return textResponse('Invalid lyric name', 400);
  }

  const uniqueCandidates = [...new Set(candidates)];

  let lastStatus = 502;
  for (const upstream of uniqueCandidates) {
    try {
      const upstreamResponse = await fetch(upstream, {
        headers: { Accept: 'text/plain, application/octet-stream;q=0.9' },
      });
      if (!upstreamResponse.ok) {
        lastStatus = upstreamResponse.status === 404 ? 404 : 502;
        continue;
      }

      const text = await upstreamResponse.text();
      if (!/\[\d{1,3}:\d{2}(?:[.:]\d{1,3})?\]/.test(text)) {
        lastStatus = 502;
        continue;
      }
      return textResponse(text);
    } catch {
      lastStatus = 502;
    }
  }

  return textResponse('Lyric not found', lastStatus);
}
