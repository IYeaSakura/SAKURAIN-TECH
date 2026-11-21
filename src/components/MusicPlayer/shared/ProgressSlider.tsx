'use client';

/**
 * Shared seek bar used by both the mini player and the full-screen page.
 * Owns the mouse-click and keyboard seek behaviour (arrow keys ±5s, Home/End)
 * plus the buffered/progress fill and ARIA slider semantics. Time labels are
 * rendered by each player so the two very different layouts stay untouched.
 */
import { useCallback } from 'react';
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

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(percent * duration);
    },
    [duration, onSeek]
  );

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
      role="slider"
      tabIndex={0}
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(currentTime)}
      aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
      onClick={handleClick}
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
