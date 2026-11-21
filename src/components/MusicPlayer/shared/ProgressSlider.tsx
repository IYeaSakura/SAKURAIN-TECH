'use client';

/**
 * Shared seek bar used by both the mini player and the full-screen page.
 * Owns pointer (mouse + touch) dragging, keyboard seeking (arrow keys ±5s,
 * Home/End) and the buffered/progress fill with ARIA slider semantics.
 *
 * Touch support matters here: a plain onClick bar cannot be dragged on a phone
 * and its 8px height is far below a comfortable finger target, so the bar
 * accepts pointer events and widens its hit area on coarse pointers in CSS.
 * Time labels are rendered by each player so the two very different layouts
 * stay untouched.
 */
import { useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { formatTime } from './player-utils';
import styles from '../player.module.css';

interface ProgressSliderProps {
  currentTime: number;
  duration: number;
  buffered: number;
  onSeek: (time: number) => void;
  /** Extra classes for the bar element (height / flex sizing differ per player). */
  className?: string;
}

export function ProgressSlider({
  currentTime,
  duration,
  buffered,
  onSeek,
  className = '',
}: ProgressSliderProps) {
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration ? (buffered / duration) * 100 : 0;
  const barRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const seekTo = useCallback(
    (clientX: number) => {
      const el = barRef.current;
      if (!el || !duration) return;
      const rect = el.getBoundingClientRect();
      if (!rect.width) return;
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onSeek(percent * duration);
    },
    [duration, onSeek]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!duration) return;
      draggingRef.current = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Pointer capture is an optimisation; dragging still works without it.
      }
      seekTo(e.clientX);
    },
    [duration, seekTo]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      seekTo(e.clientX);
    },
    [seekTo]
  );

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Already released.
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!duration) return;
      let next: number | null = null;
      if (e.key === 'ArrowRight') next = currentTime + 5;
      else if (e.key === 'ArrowLeft') next = currentTime - 5;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = duration;
      if (next === null) return;
      e.preventDefault();
      onSeek(Math.max(0, Math.min(duration, next)));
    },
    [duration, currentTime, onSeek]
  );

  return (
    <div
      ref={barRef}
      role="slider"
      tabIndex={0}
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(currentTime)}
      aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={handleKeyDown}
      className={`${styles.seekBar} cursor-pointer focus:outline-none ${className}`.trim()}
    >
      <div
        className={`${styles.seekBuffered} absolute inset-y-0 left-0 h-full`}
        style={{ width: `${bufferedPercent}%` }}
      />
      <motion.div
        className={`${styles.seekFill} absolute inset-y-0 left-0 z-10 h-full`}
        style={{ width: `${progressPercent}%` }}
      />
    </div>
  );
}
