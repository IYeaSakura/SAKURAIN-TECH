/**
 * Shared LRC lyric utilities.
 *
 * Used by the build-time playlist generator and the runtime player so both
 * sides agree on the lyric format.
 */

import { getCachedLyrics } from './asset-cache';

export interface LyricLine {
  time?: number;
  text: string;
}

/**
 * Parse raw LRC text into timed lyric lines.
 * Supports multiple time tags on the same line and ignores metadata tags.
 */
export function parseLrc(content: string): LyricLine[] {
  const lines = content.split(/\r?\n/);
  const entries: LyricLine[] = [];
  const timeTagPattern = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const timeMatches = [...trimmed.matchAll(timeTagPattern)];
    if (timeMatches.length === 0) continue;

    const text = trimmed.replace(timeTagPattern, '').trim();
    for (const match of timeMatches) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const centis = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;
      const time = minutes * 60 + seconds + centis / 1000;
      entries.push({ time, text });
    }
  }

  return entries.sort((a, b) => (a.time ?? 0) - (b.time ?? 0))
}

/**
 * Map any lyric URL to the site's own static copy. The CDN does not send
 * Access-Control-Allow-Origin, so a browser fetch to it is blocked even though
 * the LRC files are already deployed under /music/lyric on the site itself.
 */
function toLocalLyricUrl(url: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const parsed = new URL(url, window.location.href);
    if (!/\.lrc$/i.test(parsed.pathname)) return null;
    const filename = decodeURIComponent(
      parsed.pathname.split('/').filter(Boolean).pop() ?? ''
    );
    return filename ? `/music/lyric/${encodeURIComponent(filename)}` : null;
  } catch {
    return null;
  }
}

/**
 * Fetch and parse an LRC file. The same-origin static copy is preferred; the
 * original URL is kept as a fallback for deployments that do not ship lyrics.
 * Returns an empty array when every candidate is missing or unparsable.
 */
export async function fetchLyrics(url: string | undefined | null): Promise<LyricLine[]> {
  if (!url) return [];

  const localUrl = toLocalLyricUrl(url);
  const candidates = localUrl && localUrl !== url ? [localUrl, url] : [url];

  for (const candidate of candidates) {
    try {
      const text = await getCachedLyrics(candidate);
      if (!text) continue;
      const parsed = parseLrc(text);
      if (parsed.length > 0) return parsed;
    } catch {
      // Try the next candidate.
    }
  }
  return [];
}
