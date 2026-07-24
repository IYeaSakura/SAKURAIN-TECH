'use client';

/**
 * MusicWidget —— Apple 风格音乐控制卡片。
 *
 * 与全局 MusicPlayerContext 保持状态同步，
 * 以玻璃质感卡片 + 专辑封面旋转动画呈现。
 */

import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Music } from 'lucide-react';
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
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
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
      <div className="apple-bento h-full flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Playlist empty</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="apple-bento h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="apple-mono-label">NOW PLAYING</span>
        <span className="text-[10px] font-mono text-muted-foreground">
          {currentNumber.toString().padStart(2, '0')} / {totalSongs.toString().padStart(2, '0')}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <motion.div
          animate={isPlaying ? { rotate: 360 } : {}}
          transition={isPlaying ? { duration: 10, repeat: Infinity, ease: 'linear' } : {}}
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            boxShadow: '0 8px 24px rgba(10, 132, 255, 0.3)',
          }}
        >
          <Music className="w-7 h-7 text-white" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {currentSong?.title || 'Unknown Track'}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {currentSong?.artist || 'Unknown Artist'}
          </p>
        </div>
      </div>

      <div
        ref={progressRef}
        onClick={handleSeek}
        className="h-1.5 rounded-full cursor-pointer overflow-hidden mb-1.5"
        style={{ background: 'var(--bg-tertiary)' }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
            width: `${progressPercent}%`,
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground font-mono mb-4">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-muted/30 transition-colors disabled:opacity-50"
            style={{ color: 'var(--text-muted)' }}
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={togglePlay}
            disabled={isLoading && !error}
            className="p-3 rounded-full disabled:opacity-50 transition-all active:scale-95"
            style={{
              background: 'var(--accent-primary)',
              color: 'white',
              boxShadow: '0 4px 14px rgba(10, 132, 255, 0.35)',
            }}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            onClick={next}
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-muted/30 transition-colors disabled:opacity-50"
            style={{ color: 'var(--text-muted)' }}
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={open}
          className="text-[10px] text-muted-foreground hover:text-accent-primary transition-colors font-mono"
        >
          EXPAND
        </button>
      </div>
    </motion.div>
  );
}
