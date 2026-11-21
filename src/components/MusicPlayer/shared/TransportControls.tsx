'use client';

/**
 * Shared transport controls (previous / play-pause / next). Icon and loading
 * behaviour are identical in both players; only padding and gap differ, so
 * those are exposed as className props to preserve each layout.
 */
import { Loader2, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import styles from '../player.module.css';

interface TransportControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  hasError: boolean;
  onPrev: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  labels: { previous: string; next: string };
  containerClassName?: string;
  sideClassName?: string;
  mainClassName?: string;
}

export function TransportControls({
  isPlaying,
  isLoading,
  hasError,
  onPrev,
  onTogglePlay,
  onNext,
  labels,
  containerClassName = 'flex items-center justify-center gap-3',
  sideClassName = 'p-2',
  mainClassName = 'p-3',
}: TransportControlsProps) {
  return (
    <div className={containerClassName}>
      <button
        onClick={onPrev}
        className={`${styles.controlButton} ${sideClassName}`}
        title={labels.previous}
      >
        <SkipBack className="w-5 h-5" />
      </button>
      <button
        onClick={onTogglePlay}
        disabled={isLoading && !hasError}
        className={`${styles.playButton} ${mainClassName} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {isLoading && !hasError ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-6 h-6" />
        ) : (
          <Play className="w-6 h-6 ml-0.5" />
        )}
      </button>
      <button
        onClick={onNext}
        className={`${styles.controlButton} ${sideClassName}`}
        title={labels.next}
      >
        <SkipForward className="w-5 h-5" />
      </button>
    </div>
  );
}
