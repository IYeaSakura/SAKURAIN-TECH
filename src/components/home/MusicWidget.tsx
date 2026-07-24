'use client';

/**
 * Home-page music widget.
 * Mirrors the global MusicPlayer state so users can control playback from the
 * dashboard without expanding the floating player.
 */

import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  Disc,
  Loader2,
} from 'lucide-react';
import { useAnimationEnabled, useMusicPlayer } from '@/hooks';

export function MusicWidget() {
  const animationEnabled = useAnimationEnabled();
  const player = useMusicPlayer();
  const progressRef = useRef<HTMLDivElement>(null);

  const {
    isPlaying,
    currentTime,
    duration,
    isLoading,
    error,
    currentSong,
    currentNumber,
    totalSongs,
    togglePlay,
    next,
    prev,
    open,
    seek,
  } = player;

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || !duration) return;
      const rect = progressRef.current.getBoundingClientRect();
      const percent = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      seek(percent * duration);
    },
    [duration, seek]
  );

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  if (totalSongs === 0) {
    return (
      <div className="card-minimal p-4 h-full flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Playlist empty</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="card-minimal p-4 h-full flex flex-col"
    >
      {/* Widget header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Disc className="w-4 h-4 text-accent-primary" />
          <span className="mono-label">MUSIC_PLAYER</span>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">
          {currentNumber.toString().padStart(2, '0')} / {totalSongs.toString().padStart(2, '0')}
        </span>
      </div>

      {/* Album art + info */}
      <div className="flex items-center gap-3 mb-4">
        <motion.div
          animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
          transition={
            isPlaying ? { duration: 10, repeat: Infinity, ease: 'linear' } : {}
          }
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background:
              'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          }}
        >
          <Music className="w-6 h-6 text-white" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {currentSong.title || 'Unknown Track'}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {currentSong.artist || 'Unknown Artist'}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div
        ref={progressRef}
        onClick={handleSeek}
        className="h-1 rounded-full cursor-pointer overflow-hidden mb-2"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background:
              'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
            width: `${progressPercent}%`,
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground font-mono mb-4">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-muted/30 transition-colors disabled:opacity-50"
            style={{ color: 'var(--text-muted)' }}
            title="Previous"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            disabled={isLoading && !error}
            className="p-2.5 rounded-full disabled:opacity-50 transition-transform active:scale-95"
            style={{
              background:
                'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              color: 'white',
            }}
          >
            {isLoading && !error ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>

          <button
            onClick={next}
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-muted/30 transition-colors disabled:opacity-50"
            style={{ color: 'var(--text-muted)' }}
            title="Next"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={open}
          className="text-[10px] text-muted-foreground hover:text-accent-primary transition-colors font-mono"
        >
          EXPAND →
        </button>
      </div>
    </motion.div>
  );
}
