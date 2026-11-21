'use client';

/**
 * Pure helpers shared by the global mini player and the full-screen music page.
 * Keeping these in one place means fixes only need to be made once.
 */
import { ListOrdered, Repeat1, Shuffle, type LucideIcon } from 'lucide-react';
import type { PlayMode } from '@/contexts/MusicPlayerContext';
import type { LyricLine } from '@/lib/lyrics';

export function formatTime(time: number): string {
  if (!time || Number.isNaN(time)) return '0:00';
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Resolve the active timed lyric index (index within the time-stamped subset).
 * Both players use the same linear scan so highlighting can never diverge.
 */
export function getActiveTimedLyricIndex(
  lyrics: LyricLine[] | undefined,
  currentTime: number
): number {
  if (!lyrics || lyrics.length === 0) return 0;
  const timed = lyrics.filter((l) => typeof l.time === 'number');
  if (timed.length === 0) return 0;
  let idx = 0;
  for (let i = 0; i < timed.length; i++) {
    if (currentTime >= (timed[i].time as number)) {
      idx = i;
    } else {
      break;
    }
  }
  return idx;
}

/** Text of the currently active lyric line for the compact bottom strip. */
export function getActiveLyric(
  lyrics: LyricLine[] | undefined,
  currentTime: number
): string | null {
  if (!lyrics || lyrics.length === 0) return null;
  const timed = lyrics.filter((l) => typeof l.time === 'number');
  if (timed.length === 0) return null;
  const idx = getActiveTimedLyricIndex(lyrics, currentTime);
  return timed[idx]?.text || '';
}

/**
 * iOS / iPadOS detection. Needed because those browsers expose `volume` on
 * HTMLMediaElement as read-only: assigning it is silently ignored, so a volume
 * slider would look functional while changing nothing.
 */
export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iP(hone|ad|od)/.test(ua)) return true;
  // iPadOS 13+ reports a desktop Safari UA; multi-touch is the reliable tell.
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}

/** Whether the element-level volume slider can actually do anything here. */
export function supportsElementVolume(): boolean {
  return !isIOSDevice();
}

type ModeLabels = { shuffle: string; repeat: string; sequential: string };

const MODE_ICONS: Record<PlayMode, LucideIcon> = {
  shuffle: Shuffle,
  repeat: Repeat1,
  sequential: ListOrdered,
};

/** Icon + localized label for a playback mode. */
export function getModeConfig(
  mode: PlayMode,
  labels: ModeLabels
): { icon: LucideIcon; label: string } {
  return { icon: MODE_ICONS[mode], label: labels[mode] };
}
