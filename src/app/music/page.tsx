'use client';

/**
 * Music page — dedicated full-screen music player.
 *
 * Layout references mainstream desktop players:
 * - A fixed bottom bar holds the progress slider and playback controls.
 * - The main viewport shows the cover art and lyrics side by side.
 * - The playlist is a collapsible sidebar that overlays the main area and is
 *   hidden by default.
 * - The whole page fits within the viewport without scrolling.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat1,
  ListOrdered,
  ArrowLeft,
  Music,
  ListMusic,
  Loader2,
  X,
  Maximize,
  Minimize,
  Plus,
  Minus,
  AlignCenter,
  AlignLeft,
  BarChart2,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useMusicPlayer, useAnimationEnabled, useNavigation, useTranslation } from '@/hooks';
import { AudioMetrics } from '@/components/MusicPlayer/AudioMetrics';
import type { Song } from '@/contexts/MusicPlayerContext';
import type { LyricLine } from '@/lib/lyrics';

const FocusSpaceVisualizer = dynamic(
  () => import('@/components/MusicPlayer/FocusSpaceVisualizer'),
  { ssr: false }
);

const PIXEL_BORDER = '2px solid var(--border-subtle)';
const PIXEL_SHADOW = '4px 4px 0 var(--border-subtle)';

function formatTime(time: number) {
  if (!time || Number.isNaN(time)) return '0:00';
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function generateCoverSvg(title: string) {
  const hash = title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue = hash % 360;
  const patternType = hash % 4;

  let pattern = '';
  if (patternType === 0) {
    pattern = `<rect x='8' y='8' width='16' height='16' fill='hsla(${hue}, 70%, 60%, 0.8)'/>`;
  } else if (patternType === 1) {
    pattern = `<circle cx='16' cy='16' r='10' fill='none' stroke='hsla(${hue}, 70%, 60%, 0.8)' stroke-width='4'/>`;
  } else if (patternType === 2) {
    pattern = `<polygon points='16,4 28,28 4,28' fill='hsla(${hue}, 70%, 60%, 0.8)'/>`;
  } else {
    pattern = `<path d='M4 16h24M16 4v24' stroke='hsla(${hue}, 70%, 60%, 0.8)' stroke-width='4'/>`;
  }

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 32 32'>
    <rect width='32' height='32' fill='var(--bg-secondary)'/>
    ${pattern}
    <rect x='2' y='2' width='28' height='28' fill='none' stroke='var(--border-subtle)' stroke-width='2'/>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function CoverArt({ song }: { song: Song }) {
  const src = song.cover || generateCoverSvg(song.title);

  return (
    <div className="relative aspect-square w-full h-full overflow-hidden" style={{ border: PIXEL_BORDER, boxShadow: PIXEL_SHADOW }}>
      <motion.img
        key={song.id}
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        src={src}
        alt={song.title}
        className="w-full h-full object-cover"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  )
}

const LYRIC_FONT_SIZES = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl'];

function LyricsPanel({ lyrics, currentTime }: { lyrics: LyricLine[] | undefined; currentTime: number }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scaleIndex, setScaleIndex] = useState(3);
  const [centered, setCentered] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sakurain-music-lyrics');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.scaleIndex === 'number') setScaleIndex(parsed.scaleIndex);
        if (typeof parsed.centered === 'boolean') setCentered(parsed.centered);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        'sakurain-music-lyrics',
        JSON.stringify({ scaleIndex, centered })
      );
    } catch {
      // Ignore localStorage errors
    }
  }, [scaleIndex, centered]);

  const lines = useMemo(() => {
    if (!lyrics || lyrics.length === 0) {
      return [{ text: t.music.noLyrics }, { text: t.music.enjoyMusic }] as LyricLine[];
    }
    return lyrics;
  }, [lyrics, t.music.noLyrics, t.music.enjoyMusic]);

  useEffect(() => {
    if (!lyrics || lyrics.length === 0) return;
    const timed = lyrics.filter((l) => typeof l.time === 'number');
    if (timed.length === 0) return;

    let idx = 0;
    for (let i = 0; i < timed.length; i++) {
      if (currentTime >= (timed[i].time as number)) {
        idx = i;
      } else {
        break;
      }
    }
    setActiveIndex(idx);
  }, [currentTime, lyrics]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const active = el.querySelector(`[data-lyric-index="${activeIndex}"]`) as HTMLElement | null;
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex]);

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: 'var(--bg-secondary)', border: PIXEL_BORDER, boxShadow: PIXEL_SHADOW }}
    >
      <div
        className="flex items-center justify-between p-3 border-b-2"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
          >
            {t.music.lyrics}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScaleIndex((i) => Math.max(0, i - 1))}
            className="p-1.5 rounded-sm transition-colors hover:bg-[var(--bg-tertiary)]"
            style={{ border: PIXEL_BORDER, color: 'var(--text-muted)' }}
            title={t.music.shrinkLyrics}
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={() => setScaleIndex((i) => Math.min(LYRIC_FONT_SIZES.length - 1, i + 1))}
            className="p-1.5 rounded-sm transition-colors hover:bg-[var(--bg-tertiary)]"
            style={{ border: PIXEL_BORDER, color: 'var(--text-muted)' }}
            title={t.music.enlargeLyrics}
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            onClick={() => setCentered((c) => !c)}
            className="p-1.5 rounded-sm transition-colors hover:bg-[var(--bg-tertiary)]"
            style={{ border: PIXEL_BORDER, color: centered ? 'var(--accent-primary)' : 'var(--text-muted)' }}
            title={centered ? t.music.alignLeft : t.music.alignCenter}
          >
            {centered ? <AlignCenter className="w-3 h-3" /> : <AlignLeft className="w-3 h-3" />}
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <div
          ref={containerRef}
          className="h-full overflow-y-auto p-4 space-y-4 thin-scrollbar"
        >
          {lines.map((line, index) => {
            const isActive = index === activeIndex;
            return (
              <motion.p
                key={`${index}-${line.text}`}
                data-lyric-index={index}
                animate={{
                  opacity: isActive ? 1 : 0.45,
                  x: isActive ? 4 : 0,
                }}
                transition={{ duration: 0.2 }}
                className={`${LYRIC_FONT_SIZES[scaleIndex] ?? 'text-base'} leading-relaxed ${centered ? 'text-center' : 'text-left'}`}
                style={{
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontFamily: isActive ? 'var(--font-mono)' : 'inherit',
                  fontWeight: isActive ? 700 : 400,
                }}
              >
                {line.text}
              </motion.p>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PlaylistPanel({
  playlist,
  currentSong,
  onSelect,
  onClose,
}: {
  playlist: Song[];
  currentSong: Song;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const { t, tReplace } = useTranslation();
  return (
    <div
      className="h-full flex flex-col"
      style={{ background: 'var(--bg-secondary)', borderLeft: PIXEL_BORDER }}
    >
      <div
        className="flex items-center justify-between p-3 border-b-2"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
          >
            {tReplace(t.music.playlistCount, { count: playlist.length })}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-sm transition-colors hover:bg-[var(--bg-tertiary)]"
          style={{ color: 'var(--text-muted)' }}
          title={t.music.closePlaylist}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
        <div className="divide-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
          {playlist.map((song, index) => {
            const isCurrent = song.id === currentSong.id;
            return (
              <button
                key={song.id}
                onClick={() => onSelect(song.id)}
                className="w-full text-left p-3 transition-all hover:pl-4"
                style={{
                  background: isCurrent ? 'var(--bg-tertiary)' : 'transparent',
                  borderBottom: '2px solid var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs font-mono w-5"
                    style={{ color: isCurrent ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-bold truncate"
                      style={{
                        color: isCurrent ? 'var(--accent-primary)' : 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {song.title}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {song.artist}
                    </p>
                  </div>
                  {isCurrent && (
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="flex items-end gap-0.5 h-3"
                    >
                      <span className="w-1 h-1 bg-[var(--accent-primary)]" />
                      <span className="w-1 h-3 bg-[var(--accent-primary)]" />
                      <span className="w-1 h-2 bg-[var(--accent-primary)]" />
                    </motion.div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function MusicPage() {
  const player = useMusicPlayer();
  const animationEnabled = useAnimationEnabled();
  const { navigateTo } = useNavigation();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    error,
    isLoading,
    buffered,
    currentSong,
    currentLyrics,
    playlist,
    playMode,
    showPlaylist,
    systemPaused,
    visualizerMode,
    togglePlay,
    next,
    prev,
    setVolume,
    toggleMuted,
    playSong,
    seek,
    cyclePlayMode,
    togglePlaylist,
    changeVisualizer,
  } = player;

  const handleSeek = (percent: number) => {
    if (!duration) return;
    seek(percent * duration);
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration ? (buffered / duration) * 100 : 0;

  const modeConfig = {
    shuffle: { icon: Shuffle, label: t.music.shuffle },
    repeat: { icon: Repeat1, label: t.music.repeat },
    sequential: { icon: ListOrdered, label: t.music.sequential },
  }[playMode];

  const ModeIcon = modeConfig.icon;

  if (!mounted) {
    return (
      <div className="h-screen overflow-hidden flex flex-col" style={{ background: 'var(--bg-primary)' }}>
        <header className="flex-none h-14 px-4 sm:px-6 pt-20 lg:pt-24">
          <div className="h-8 w-32 bg-[var(--bg-tertiary)] border-2 border-[var(--border-subtle)] animate-pulse" />
        </header>
        <main className="flex-1 min-h-0 px-4 sm:px-6 pb-4">
          <div className="h-full flex flex-col lg:flex-row gap-4">
            <div className="flex-none lg:flex-1 h-[40%] lg:h-auto bg-[var(--bg-secondary)] border-2 border-[var(--border-subtle)] animate-pulse" />
            <div className="flex-1 min-h-0 bg-[var(--bg-secondary)] border-2 border-[var(--border-subtle)] animate-pulse" />
          </div>
        </main>
        <div className="flex-none h-20 sm:h-24 border-t-2 border-[var(--border-subtle)] bg-[var(--bg-secondary)] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Top header */}
      <header className="flex-none pt-20 lg:pt-24 px-4 sm:px-6 pb-2">
        <motion.div
          initial={animationEnabled ? { opacity: 0, y: 12 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
          <button
            onClick={() => navigateTo('/')}
            className="inline-flex items-center gap-2 px-2 py-1 rounded-sm text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-70"
            style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            {t.music.backToHome}
          </button>
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            <h1
              className="text-xl sm:text-2xl font-bold uppercase"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
            >
              {t.nav.music}
            </h1>
          </div>
        </motion.div>
      </header>

      {/* Main stage: cover + lyrics or focus visualizer */}
      <main className="flex-1 min-h-0 relative">
        <div className="h-full flex flex-col lg:flex-row gap-4 px-4 sm:px-6 pb-4">
          {visualizerMode === 'focus' ? (
            <motion.section
              initial={animationEnabled ? { opacity: 0 } : undefined}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="flex-1 min-h-0"
            >
              <FocusSpaceVisualizer audioRef={audioRef} isPlaying={isPlaying} />
            </motion.section>
          ) : (
            <>
              {/* Cover art */}
              <motion.section
                initial={animationEnabled ? { opacity: 0, scale: 0.96 } : undefined}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="flex-none lg:flex-1 h-[38%] sm:h-[42%] lg:h-auto flex items-center justify-center"
              >
                <div className="h-full aspect-square max-h-full">
                  <CoverArt song={currentSong} />
                </div>
              </motion.section>

              {/* Lyrics panel */}
              <motion.section
                initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex-1 min-h-0 lg:flex-1"
              >
                <LyricsPanel lyrics={currentLyrics} currentTime={currentTime} />
              </motion.section>
            </>
          )}
        </div>

        {/* Collapsible playlist sidebar */}
        <AnimatePresence>
          {showPlaylist && (
            <motion.div
              initial={animationEnabled ? { x: '100%' } : undefined}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute right-0 top-0 bottom-0 w-full sm:w-80 z-20"
              style={{ boxShadow: '-4px 0 0 var(--border-subtle)' }}
            >
              <PlaylistPanel
                playlist={playlist}
                currentSong={currentSong}
                onSelect={playSong}
                onClose={togglePlaylist}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Fixed bottom control bar */}
      <motion.div
        initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="flex-none h-20 sm:h-24 border-t-2 px-3 sm:px-6 flex flex-col justify-center gap-2 z-30"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
      >
        {/* Progress row */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-[10px] font-mono w-9 text-right" style={{ color: 'var(--text-muted)' }}>
            {formatTime(currentTime)}
          </span>
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              handleSeek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
            }}
            className="flex-1 h-2 cursor-pointer relative overflow-hidden"
            style={{ background: 'var(--bg-tertiary)', border: PIXEL_BORDER }}
          >
            <div
              className="absolute inset-y-0 left-0 h-full"
              style={{ background: 'var(--text-muted)', width: `${bufferedPercent}%`, opacity: 0.25 }}
            />
            <motion.div
              className="absolute inset-y-0 left-0 h-full z-10"
              style={{ background: 'var(--accent-primary)', width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-mono w-9" style={{ color: 'var(--text-muted)' }}>
            {formatTime(duration)}
          </span>
        </div>

        {/* System pause notice */}
        {systemPaused && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center gap-2 py-1 text-[10px] font-bold uppercase tracking-wider border-b-2"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}
          >
            <span className="w-1.5 h-1.5 bg-[var(--accent-primary)] animate-pulse" />
            {t.music.systemPausedNotice}
          </motion.div>
        )}

        {/* Controls row */}
        <div className="relative flex items-center justify-between gap-2 min-h-[2.5rem]">
          {/* Audio metrics */}
          <div className="hidden sm:flex items-center flex-1 min-w-0">
            <AudioMetrics audioRef={audioRef} isPlaying={isPlaying} isLoading={isLoading} systemPaused={systemPaused} />
          </div>

          {/* Playback controls — absolute center */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-2">
            <button
              onClick={prev}
              className="p-1.5 sm:p-2 rounded-sm transition-colors hover:bg-[var(--bg-tertiary)]"
              style={{ border: PIXEL_BORDER, color: 'var(--text-secondary)' }}
              title={t.music.previous}
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlay}
              disabled={isLoading && !error}
              className="p-2.5 sm:p-3 rounded-sm transition-all disabled:opacity-50"
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
              className="p-1.5 sm:p-2 rounded-sm transition-colors hover:bg-[var(--bg-tertiary)]"
              style={{ border: PIXEL_BORDER, color: 'var(--text-secondary)' }}
              title={t.music.next}
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Extra controls */}
          <div className="flex items-center justify-end gap-1 sm:gap-2 flex-1">
            <button
              onClick={cyclePlayMode}
              className="p-1.5 sm:p-2 rounded-sm transition-colors hover:bg-[var(--bg-tertiary)]"
              style={{ border: PIXEL_BORDER, color: 'var(--accent-primary)' }}
              title={modeConfig.label}
            >
              <ModeIcon className="w-4 h-4" />
            </button>
            <button
              onClick={toggleMuted}
              className="p-1.5 sm:p-2 rounded-sm"
              style={{ border: PIXEL_BORDER, color: 'var(--text-muted)' }}
              title={isMuted || volume === 0 ? t.music.unmute : t.music.mute}
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
              className="hidden sm:block w-20 lg:w-28 h-2 appearance-none cursor-pointer rounded-sm"
              style={{
                background: `linear-gradient(90deg, var(--accent-primary) ${(isMuted ? 0 : volume) * 100}%, var(--bg-tertiary) ${(isMuted ? 0 : volume) * 100}%)`,
                border: PIXEL_BORDER,
              }}
            />
            <button
              onClick={togglePlaylist}
              className="p-1.5 sm:p-2 rounded-sm transition-colors hover:bg-[var(--bg-tertiary)]"
              style={{
                border: PIXEL_BORDER,
                color: showPlaylist ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
              title={t.music.playlist}
            >
              <ListMusic className="w-4 h-4" />
            </button>
            <button
              onClick={changeVisualizer}
              className="p-1.5 sm:p-2 rounded-sm transition-colors hover:bg-[var(--bg-tertiary)]"
              style={{
                border: PIXEL_BORDER,
                color: visualizerMode === 'focus' ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
              title={visualizerMode}
            >
              <BarChart2 className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2 rounded-sm transition-colors hover:bg-[var(--bg-tertiary)]"
              style={{ border: PIXEL_BORDER, color: 'var(--text-muted)' }}
              title={isFullscreen ? t.music.exitFullscreen : t.music.fullscreen}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
