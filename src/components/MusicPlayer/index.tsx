'use client';

/**
 * 全站音乐播放器 —— 新粗犷主义风格。
 *
 * 固定在页面右下角，切换页面不会中断播放。
 * 支持切换播放顺序（随机/单曲循环/顺序）、展开播放列表、开关底部歌词。
 * 在 /music 页面自动隐藏，由音乐页面自身承载完整控件。
 */

import { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music,
  Shuffle,
  Repeat1,
  ListOrdered,
  ListMusic,
  Mic2,
  X,
  Loader2,
} from 'lucide-react';
import { useAnimationEnabled, useMusicPlayer } from '@/hooks';
import type { Song, LyricLine } from '@/contexts/MusicPlayerContext';

const PIXEL_BORDER = '2px solid var(--border-subtle)';
const PIXEL_SHADOW = '4px 4px 0 var(--border-subtle)';

function formatTime(time: number) {
  if (!time || Number.isNaN(time)) return '0:00';
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getActiveLyric(lyrics: LyricLine[] | undefined, currentTime: number) {
  if (!lyrics || lyrics.length === 0) return null;
  const timed = lyrics.filter((l) => typeof l.time === 'number');
  if (timed.length === 0) return null;
  let idx = 0;
  for (let i = 0; i < timed.length; i++) {
    if (currentTime >= (timed[i].time as number)) {
      idx = i;
    } else {
      break;
    }
  }
  return timed[idx]?.text || '';
}

function MiniPlaylist({
  playlist,
  currentSong,
  onSelect,
}: {
  playlist: Song[];
  currentSong: Song;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className="border-t-2 mt-3 max-h-48 overflow-y-auto"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      {playlist.map((song, index) => {
        const isCurrent = song.id === currentSong.id;
        return (
          <button
            key={song.id}
            onClick={() => onSelect(song.id)}
            className="w-full text-left p-2.5 transition-colors hover:bg-[var(--bg-tertiary)]"
            style={{
              background: isCurrent ? 'var(--bg-tertiary)' : 'transparent',
              borderBottom: index < playlist.length - 1 ? '2px solid var(--border-subtle)' : 'none',
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-mono w-5"
                style={{ color: isCurrent ? 'var(--accent-primary)' : 'var(--text-muted)' }}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-bold truncate"
                  style={{
                    color: isCurrent ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {song.title}
                </p>
                <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                  {song.artist}
                </p>
              </div>
              {isCurrent && (
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="flex items-end gap-0.5 h-3"
                >
                  <span className="w-0.5 h-1 bg-[var(--accent-primary)]" />
                  <span className="w-0.5 h-3 bg-[var(--accent-primary)]" />
                  <span className="w-0.5 h-2 bg-[var(--accent-primary)]" />
                </motion.div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function MusicPlayer() {
  const animationEnabled = useAnimationEnabled();
  const player = useMusicPlayer();
  const pathname = usePathname();
  const isMusicPage = pathname === '/music';
  const progressRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
    playlist,
    playMode,
    showLyrics,
    showPlaylist,
    togglePlay,
    next,
    prev,
    open,
    close,
    setVolume,
    toggleMuted,
    seek,
    playSong,
    cyclePlayMode,
    toggleLyrics,
    togglePlaylist,
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

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration ? (buffered / duration) * 100 : 0;
  const activeLyric = useMemo(
    () => getActiveLyric(currentSong.lyrics, currentTime),
    [currentSong.lyrics, currentTime]
  );

  // Skip rendering on mobile, while loading playlist, on the music page, or when playlist is empty
  if (!isClient || playlistLoading || totalSongs === 0 || isMusicPage) return null;

  const modeConfig = {
    shuffle: { icon: Shuffle, label: '随机' },
    repeat: { icon: Repeat1, label: '单曲' },
    sequential: { icon: ListOrdered, label: '顺序' },
  }[playMode];

  const ModeIcon = modeConfig.icon;

  return (
    <>
      {/* Bottom lyrics bar */}
      <AnimatePresence>
        {showLyrics && activeLyric && (
          <motion.div
            initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[99] max-w-xl w-[calc(100%-2rem)] px-4 py-2 text-center"
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--accent-primary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <p className="text-sm font-bold truncate">{activeLyric}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen ? (
        /* Collapsed mini player */
        <motion.div
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 z-[100]"
        >
          <motion.button
            onClick={open}
            whileHover={animationEnabled ? { x: -2, y: -2 } : undefined}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-2 rounded-sm transition-all"
            style={{
              background: 'var(--bg-secondary)',
              border: PIXEL_BORDER,
              boxShadow: isPlaying ? '4px 4px 0 var(--accent-primary)' : PIXEL_SHADOW,
            }}
          >
            <div
              className="w-8 h-8 flex items-center justify-center border-2"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <Music className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            </div>

            <div className="flex flex-col items-start">
              <span
                className="text-xs font-bold max-w-[90px] truncate"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
              >
                {currentSong.title}
              </span>
              <span className="text-[10px] max-w-[90px] truncate" style={{ color: 'var(--text-muted)' }}>
                {isLoading ? 'Loading...' : error ? 'Unavailable' : isPlaying ? 'Playing' : `${currentNumber}/${totalSongs}`}
              </span>
            </div>

            <motion.div
              animate={{ opacity: isPlaying && !isLoading ? 1 : 0 }}
              className="flex items-end gap-[2px] h-3"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-[3px] bg-[var(--accent-primary)]"
                  animate={
                    isPlaying && !isLoading
                      ? { height: [4, 12, 5, 10, 4] }
                      : { height: 4 }
                  }
                  transition={{
                    duration: 0.7,
                    repeat: Infinity,
                    delay: i * 0.12,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>
          </motion.button>
        </motion.div>
      ) : (
        /* Expanded player panel */
        <motion.div
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 z-[100] w-[300px]"
        >
          <div
            className="overflow-hidden"
            style={{
              background: 'var(--bg-secondary)',
              border: PIXEL_BORDER,
              boxShadow: PIXEL_SHADOW,
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-3 py-2 border-b-2"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <ModeIcon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                <span
                  className="text-xs font-bold uppercase"
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                >
                  {modeConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={cyclePlayMode}
                  className="p-1.5 rounded-sm transition-colors hover:bg-[var(--bg-tertiary)]"
                  style={{ color: 'var(--text-muted)' }}
                  title="切换播放顺序"
                >
                  <ModeIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={togglePlaylist}
                  className="p-1.5 rounded-sm transition-colors hover:bg-[var(--bg-tertiary)]"
                  style={{ color: showPlaylist ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                  title="播放列表"
                >
                  <ListMusic className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleLyrics}
                  className="p-1.5 rounded-sm transition-colors hover:bg-[var(--bg-tertiary)]"
                  style={{ color: showLyrics ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                  title="底部歌词"
                >
                  <Mic2 className="w-4 h-4" />
                </button>
                <button
                  onClick={close}
                  className="p-1.5 rounded-sm transition-colors hover:bg-[var(--bg-tertiary)]"
                  style={{ color: 'var(--text-muted)' }}
                  title="收起"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Track info */}
            <div className="px-4 py-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 flex items-center justify-center border-2"
                  style={{
                    background: 'var(--bg-primary)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <Music className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-bold text-sm truncate"
                    style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                  >
                    {currentSong.title}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {currentSong.artist}
                  </p>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div
                  className="mt-2 text-xs text-center p-2 rounded-sm cursor-pointer border-2"
                  style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)', color: 'var(--error)' }}
                  onClick={togglePlay}
                >
                  {error} — 点击重试
                </div>
              )}

              {/* Progress */}
              <div className="mt-4">
                <div
                  ref={progressRef}
                  onClick={handleSeek}
                  className="h-2.5 cursor-pointer overflow-hidden relative"
                  style={{ background: 'var(--bg-tertiary)', border: PIXEL_BORDER }}
                >
                  <div
                    className="absolute inset-y-0 left-0 h-full"
                    style={{
                      background: 'var(--text-muted)',
                      width: `${bufferedPercent}%`,
                      opacity: 0.25,
                    }}
                  />
                  <motion.div
                    className="absolute inset-y-0 left-0 h-full z-10"
                    style={{ background: 'var(--accent-primary)', width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3 mt-3">
                <button
                  onClick={prev}
                  className="p-2 rounded-sm transition-colors hover:bg-[var(--bg-tertiary)]"
                  style={{ border: PIXEL_BORDER, color: 'var(--text-secondary)' }}
                  title="Previous"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  onClick={togglePlay}
                  disabled={isLoading && !error}
                  className="p-3 rounded-sm transition-all disabled:opacity-50"
                  style={{
                    background: 'var(--accent-primary)',
                    border: PIXEL_BORDER,
                    color: 'var(--bg-primary)',
                  }}
                >
                  {isLoading && !error ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-0.5" />
                  )}
                </button>
                <button
                  onClick={next}
                  className="p-2 rounded-sm transition-colors hover:bg-[var(--bg-tertiary)]"
                  style={{ border: PIXEL_BORDER, color: 'var(--text-secondary)' }}
                  title="Next"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={toggleMuted}
                  className="p-1.5"
                  style={{ border: PIXEL_BORDER, color: 'var(--text-muted)' }}
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1 h-2 appearance-none cursor-pointer rounded-sm"
                  style={{
                    background: `linear-gradient(90deg, var(--accent-primary) ${(isMuted ? 0 : volume) * 100}%, var(--bg-tertiary) ${(isMuted ? 0 : volume) * 100}%)`,
                    border: PIXEL_BORDER,
                  }}
                />
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-center gap-2 mt-3 pt-2 border-t-2"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <Shuffle className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} />
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  Track {currentNumber} / {totalSongs} · {visualizerMode}
                </span>
              </div>

              {/* Playlist panel */}
              <AnimatePresence>
                {showPlaylist && (
                  <motion.div
                    initial={animationEnabled ? { opacity: 0, height: 0 } : undefined}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <MiniPlaylist playlist={playlist} currentSong={currentSong} onSelect={playSong} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}

export default MusicPlayer;
