'use client';

/**
 * 全站音乐播放器 - 随机播放模式
 * 固定在页面右下角，切换页面不会中断播放。
 * 播放逻辑已迁移到 MusicPlayerContext；本组件仅负责渲染与交互。
 */

import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music,
  Shuffle,
  Loader2,
  BarChart3,
  Waves,
  Grid3X3,
} from 'lucide-react';
import { useAnimationEnabled, useMusicPlayer } from '@/hooks';
import { AudioVisualizer } from './AudioVisualizer';

export function MusicPlayer() {
  const animationEnabled = useAnimationEnabled();
  const player = useMusicPlayer();
  const progressRef = useRef<HTMLDivElement>(null);

  const {
    isOpen,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    error,
    isLoading,
    buffered,
    currentNumber,
    totalSongs,
    currentSong,
    visualizerMode,
    playlistLoading,
    togglePlay,
    next,
    prev,
    open,
    close,
    setVolume,
    toggleMuted,
    changeVisualizer,
  } = player;

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || !duration) return;
      const rect = progressRef.current.getBoundingClientRect();
      const percent = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      player.seek(percent * duration);
    },
    [duration, player]
  );

  // Skip rendering on mobile, while loading playlist, or when playlist is empty
  if (playlistLoading || totalSongs === 0) return null;

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration ? (buffered / duration) * 100 : 0;

  return (
    <>
      {!isOpen ? (
        <motion.div
          initial={animationEnabled ? { opacity: 0, y: 20, scale: 0.8 } : undefined}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 z-[100]"
        >
          {/* Mini player */}
          <motion.button
            onClick={open}
            whileHover={animationEnabled ? { scale: 1.05 } : undefined}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-2 rounded-full shadow-lg backdrop-blur-md relative overflow-hidden transition-all duration-500"
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${isPlaying ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
              boxShadow: isPlaying
                ? '0 4px 20px var(--accent-glow), 0 0 30px var(--accent-glow)'
                : '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
            animate={{
              borderColor: isPlaying ? 'var(--accent-primary)' : 'var(--border-subtle)',
            }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {/* Breathing glow during playback */}
            <motion.div
              className="absolute inset-0 pointer-events-none overflow-hidden rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: isPlaying ? 1 : 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            >
              <motion.div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary), var(--accent-primary))',
                  backgroundSize: '200% 100%',
                  opacity: 0.15,
                }}
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 50% 50%, transparent 30%, var(--bg-card) 80%)',
                }}
              />
              <motion.div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 50% 50%, var(--accent-glow) 0%, transparent 40%)',
                }}
                animate={{
                  opacity: [0.1, 0.25, 0.1],
                  scale: [0.9, 1.05, 0.9],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>

            {/* Music icon */}
            <motion.div
              animate={isPlaying ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative z-10"
              style={{
                background:
                  'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              }}
            >
              <motion.div
                className="absolute -inset-0.5 rounded-full -z-10"
                style={{
                  background:
                    'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
                }}
                animate={
                  isPlaying
                    ? {
                        opacity: [0.3, 0.5, 0.3],
                        scale: [1, 1.2, 1],
                      }
                    : { opacity: 0 }
                }
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <Music className="w-4 h-4 text-white" />
            </motion.div>

            <div className="flex flex-col items-start relative z-10">
              <span
                className="text-xs font-medium max-w-[80px] truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {currentSong.title}
              </span>
              <motion.span
                className="text-[10px] max-w-[80px] truncate"
                animate={{
                  color: isPlaying ? 'var(--accent-primary)' : 'var(--text-muted)',
                }}
                transition={{ duration: 0.3 }}
              >
                {isLoading
                  ? 'Loading...'
                  : error
                    ? 'Unavailable'
                    : isPlaying
                      ? 'Playing'
                      : `${currentNumber}/${totalSongs}`}
              </motion.span>
            </div>

            {/* Mini spectrum */}
            <motion.div
              className="flex items-end gap-[3px] h-4 relative z-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: isPlaying && !isLoading ? 1 : 0,
                scale: isPlaying && !isLoading ? 1 : 0.8,
              }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-full"
                  style={{
                    background: 'var(--accent-primary)',
                    boxShadow:
                      '0 0 6px var(--accent-primary), 0 0 12px var(--accent-secondary)',
                  }}
                  animate={
                    isPlaying && !isLoading
                      ? {
                          height: [4, 14, 6, 12, 4],
                        }
                      : { height: 4 }
                  }
                  transition={{
                    height: {
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: 'easeInOut',
                    },
                  }}
                />
              ))}
            </motion.div>

            {/* Loading spinner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: isLoading ? 1 : 0,
                scale: isLoading ? 1 : 0.8,
              }}
              transition={{ duration: 0.2 }}
              className="relative z-10"
            >
              {isLoading && (
                <Loader2
                  className="w-4 h-4 animate-spin"
                  style={{ color: 'var(--accent-primary)' }}
                />
              )}
            </motion.div>

            {/* Paused icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: !isPlaying && !isLoading ? 1 : 0,
                scale: !isPlaying && !isLoading ? 1 : 0.8,
              }}
              transition={{ duration: 0.2 }}
              className="relative z-10"
            >
              {!isPlaying && !isLoading && (
                <Pause className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              )}
            </motion.div>
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          initial={animationEnabled ? { opacity: 0, y: 20, scale: 0.9 } : undefined}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 z-[100] w-[280px]"
        >
          <div
            className="rounded-2xl overflow-hidden backdrop-blur-xl"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <Shuffle
                  className="w-4 h-4"
                  style={{ color: 'var(--accent-primary)' }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Shuffle
                </span>
              </div>
              <div className="flex items-center gap-1">
                <motion.button
                  onClick={changeVisualizer}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 rounded-lg transition-colors hover:bg-accent-primary/10"
                  style={{ color: 'var(--text-muted)' }}
                  title={`Visualizer: ${visualizerMode}`}
                >
                  {visualizerMode === 'bars' && <BarChart3 className="w-4 h-4" />}
                  {visualizerMode === 'wave' && <Waves className="w-4 h-4" />}
                  {visualizerMode === 'heatmap' && <Grid3X3 className="w-4 h-4" />}
                </motion.button>
                <motion.button
                  onClick={close}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                  style={{ color: 'var(--text-muted)' }}
                  title="Collapse player"
                >
                  <span className="text-xs">✕</span>
                </motion.button>
              </div>
            </div>

            {/* Track info */}
            <div className="px-4 py-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                  transition={
                    isPlaying
                      ? { duration: 8, repeat: Infinity, ease: 'linear' }
                      : {}
                  }
                  className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    boxShadow: '0 4px 15px var(--accent-glow)',
                  }}
                >
                  <Music className="w-7 h-7 text-white" />
                </motion.div>

                <div className="flex-1 min-w-0">
                  <motion.p
                    key={currentSong.title}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {currentSong.title}
                  </motion.p>
                  <motion.p
                    key={currentSong.artist}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-sm truncate"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {currentSong.artist}
                  </motion.p>
                </div>
              </div>

              {/* Visualizer */}
              <div className="mt-3">
                <AudioVisualizer
                  audioRef={player.audioRef}
                  isPlaying={isPlaying}
                  mode={visualizerMode}
                />
              </div>

              {/* Error message */}
              {error && (
                <div
                  className="mt-2 text-xs text-red-400 text-center cursor-pointer"
                  onClick={togglePlay}
                >
                  {error}
                </div>
              )}

              {/* Progress */}
              <div className="mt-4">
                <div
                  ref={progressRef}
                  onClick={handleSeek}
                  className="h-1.5 rounded-full cursor-pointer overflow-hidden relative"
                  style={{ background: 'var(--bg-secondary)' }}
                >
                  <div
                    className="absolute top-0 left-0 h-full rounded-full opacity-30"
                    style={{
                      background: 'var(--text-muted)',
                      width: `${bufferedPercent}%`,
                    }}
                  />
                  <motion.div
                    className="h-full rounded-full relative z-10"
                    style={{
                      background:
                        'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                      width: `${progressPercent}%`,
                    }}
                  />
                </div>
                <div
                  className="flex justify-between mt-1 text-[10px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 mt-3">
                <motion.button
                  onClick={prev}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={isLoading}
                  className="p-2 rounded-full transition-colors disabled:opacity-50"
                  style={{
                    color: 'var(--text-muted)',
                    background: 'var(--bg-secondary)',
                  }}
                  title="Previous"
                >
                  <SkipBack className="w-5 h-5" />
                </motion.button>

                <motion.button
                  onClick={togglePlay}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={isLoading && !error}
                  className="p-3 rounded-full disabled:opacity-50"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    boxShadow: '0 4px 15px var(--accent-glow)',
                  }}
                >
                  {isLoading && !error ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-0.5" />
                  )}
                </motion.button>

                <motion.button
                  onClick={next}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={isLoading}
                  className="p-2 rounded-full transition-colors disabled:opacity-50"
                  style={{
                    color: 'var(--text-muted)',
                    background: 'var(--bg-secondary)',
                  }}
                  title="Next"
                >
                  <SkipForward className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-2 mt-3">
                <motion.button
                  onClick={toggleMuted}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{ color: 'var(--text-muted)' }}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </motion.button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                  }}
                  className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(90deg, var(--accent-primary) ${(isMuted ? 0 : volume) * 100}%, var(--bg-secondary) ${(isMuted ? 0 : volume) * 100}%)`,
                  }}
                />
              </div>

              {/* Track info footer */}
              <div
                className="flex items-center justify-center gap-1 mt-3 pt-2 border-t"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <Shuffle
                  className="w-3 h-3"
                  style={{ color: 'var(--accent-primary)' }}
                />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Track {currentNumber} / {totalSongs} · {visualizerMode}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}

export default MusicPlayer;
