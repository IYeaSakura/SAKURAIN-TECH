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
  const timeTagPattern = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const timeMatches = [...trimmed.matchAll(timeTagPattern)];
    if (timeMatches.length === 0) continue;

    const text = trimmed.replace(timeTagPattern, '').trim();
    for (const match of timeMatches) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const centis = parseInt(match[3].padEnd(3, '0'), 10);
      const time = minutes * 60 + seconds + centis / 1000;
      entries.push({ time, text });
    }
  }

  return entries.sort((a, b) => (a.time ?? 0) - (b.time ?? 0))
}

/**
 * Fetch and parse an LRC file from an external URL.
 * Returns an empty array when the URL is missing or the request fails.
 */
export async function fetchLyrics(url: string | undefined | null): Promise<LyricLine[]> {
  if (!url) return [];

  try {
    const text = await getCachedLyrics(url);
    if (text === null) return [];
    return parseLrc(text);
  } catch {
    return [];
  }
}
