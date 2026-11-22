/**
 * Shared LRC lyric utilities.
 *
 * Used by the runtime player to fetch lyrics on demand. Build-time parsing was
 * removed so playlist.json stays small; the playlist only stores a mirror URL.
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

  return entries.sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
}

/**
 * Extract a safe LRC filename from either an absolute mirror URL or an older
 * same-origin path. The filename alone is enough to address both endpoints.
 */
function toLyricFilename(url: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const parsed = new URL(url, window.location.href);
    if (!/\.lrc$/i.test(parsed.pathname)) return null;
    const filename = decodeURIComponent(
      parsed.pathname.split('/').filter(Boolean).pop() ?? ''
    );
    if (!filename || /[/\\]/.test(filename) || filename.includes('..')) return null;
    return filename;
  } catch {
    return null;
  }
}

/**
 * The media mirror does not send CORS headers, so the browser reads it through
 * this same-origin EdgeOne function. On production this is an https URL and is
 * therefore also eligible for the persistent asset cache.
 */
function toProxyUrl(sourceUrl: string, filename: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const params = new URLSearchParams({ name: filename });
  try {
    const target = new URL(sourceUrl, window.location.href);
    if (target.protocol === 'https:') params.set('url', target.toString());
  } catch {
    // Fall back to the filename-only form.
  }
  return `${origin}/api/lyric?${params.toString()}`;
}

/** Same-origin static copy, kept as a fallback for the edge proxy. */
function toLocalUrl(filename: string): string {
  return `/music/lyric/${encodeURIComponent(filename)}`;
}

/**
 * Fetch and parse an LRC file. The mirror is the source of truth; it is read
 * through the same-origin proxy. The static site copy and the legacy absolute
 * URL are fallbacks for deployments without the edge function.
 * Returns an empty array when every candidate is missing or unparsable.
 */
export async function fetchLyrics(url: string | undefined | null): Promise<LyricLine[]> {
  if (!url) return [];

  const filename = toLyricFilename(url);
  const candidates: string[] = [];

  if (filename) {
    candidates.push(toProxyUrl(url, filename));
    const localUrl = toLocalUrl(filename);
    if (!candidates.includes(localUrl)) candidates.push(localUrl);
  }

  // Last resort for deployments where the mirror has since enabled CORS.
  if (url && !candidates.includes(url)) candidates.push(url);

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
