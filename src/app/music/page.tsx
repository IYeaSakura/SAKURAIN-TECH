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
import { PIXEL_BORDER, PIXEL_SHADOW } from '@/utils/styles';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Music,
  ListMusic,
  X,
  Maximize,
  Minimize,
  Plus,
  Minus,
  AlignCenter,
  AlignLeft,
} from 'lucide-react';
import { useMusicPlayer, useAnimationEnabled, useNavigation, useTranslation } from '@/hooks';
import { AudioMetrics } from '@/components/MusicPlayer/AudioMetrics';
import { ProgressSlider } from '@/components/MusicPlayer/shared/ProgressSlider';
import { TransportControls } from '@/components/MusicPlayer/shared/TransportControls';
import { VolumeControl } from '@/components/MusicPlayer/shared/VolumeControl';
import { PlaylistItem } from '@/components/MusicPlayer/shared/PlaylistItem';
import {
  formatTime,
  getActiveTimedLyricIndex,
  getModeConfig,
} from '@/components/MusicPlayer/shared/player-utils';
import { getCachedCoverUrl, revokeBlobUrl } from '@/lib/asset-cache';
import type { Song } from '@/contexts/MusicPlayerContext';
import type { LyricLine } from '@/lib/lyrics';


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
  const fallback = useMemo(() => generateCoverSvg(song.title), [song.title]);
  const [src, setSrc] = useState(song.cover || fallback);

  useEffect(() => {
    let blobUrl: string | null = null;
    let cancelled = false;
    const cover = song.cover;

    // Reset to this track's placeholder so a previous track's cover is never
    // shown while the new one loads (or when the new track has no cover).
    setSrc(cover || fallback);
    if (!cover) return;

    getCachedCoverUrl(cover)
      .then((cached) => {
        if (cancelled) return;
        if (cached !== cover) blobUrl = cached;
        setSrc(cached);
      })
      .catch(() => {
        if (!cancelled) setSrc(fallback);
      });

    return () => {
      cancelled = true;
      if (blobUrl) revokeBlobUrl(blobUrl);
    };
  }, [song.cover, fallback]);

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
    const timed = lyrics?.filter((l) => typeof l.time === 'number');
    if (!timed || timed.length === 0) return;

    // Map the timed-line index back to its position in the full `lines` array
    // so the highlight points at the correct rendered row even if untimed rows
    // (e.g. the "no lyrics" placeholders) are present.
    const activeLine = timed[getActiveTimedLyricIndex(lyrics, currentTime)];
    const lineIdx = lines.findIndex((l) => l === activeLine);
    setActiveIndex(lineIdx >= 0 ? lineIdx : 0);
  }, [currentTime, lyrics, lines]);

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
          {playlist.map((song, index) => (
            <PlaylistItem
              key={song.id}
              song={song}
              index={index}
              isCurrent={song.id === currentSong.id}
              isLast={index === playlist.length - 1}
              onSelect={onSelect}
              variant="full"
            />
          ))}
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
    currentAudioSource,
    togglePlay,
    next,
    prev,
    setVolume,
    toggleMuted,
    playSong,
    seek,
    cyclePlayMode,
    togglePlaylist,
  } = player;

  const modeConfig = getModeConfig(playMode, {
    shuffle: t.music.shuffle,
    repeat: t.music.repeat,
    sequential: t.music.sequential,
  });

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
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              <h1
                className="text-xl sm:text-2xl font-bold uppercase"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
              >
                {t.nav.music}
              </h1>
            </div>
            <div
              className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-right truncate max-w-[50vw] sm:max-w-md"
              style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
            >
              {currentSong.artist} - {currentSong.title}
            </div>
          </div>
        </motion.div>
      </header>

      {/* Main stage: cover + lyrics */}
      <main className="flex-1 min-h-0 relative">
        <div className="h-full flex flex-col lg:flex-row gap-4 px-4 sm:px-6 pb-4">
          {/* Cover art */}
          <motion.section
            initial={animationEnabled ? { opacity: 0, scale: 0.96 } : undefined}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="flex-none lg:flex-1 h-[38%] sm:h-[42%] lg:h-auto flex items-center justify-center"
          >
            <div className="h-full aspect-square max-h-full">
              <CoverArt key={currentSong.id} song={currentSong} />
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
          <ProgressSlider
            currentTime={currentTime}
            duration={duration}
            buffered={buffered}
            onSeek={seek}
            className="flex-1 h-2"
          />
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
          <TransportControls
            isPlaying={isPlaying}
            isLoading={isLoading}
            hasError={Boolean(error)}
            onPrev={prev}
            onTogglePlay={togglePlay}
            onNext={next}
            labels={{ previous: t.music.previous, next: t.music.next }}
            containerClassName="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-2"
            sideClassName="p-1.5 sm:p-2"
            mainClassName="p-2.5 sm:p-3"
          />

          {/* Extra controls */}
          <div className="flex items-center justify-end gap-1 sm:gap-2 flex-1">
            <span
              className="hidden sm:inline-flex px-2 py-1 text-[10px] font-mono font-bold uppercase border-2"
              style={{
                borderColor: 'var(--border-subtle)',
                color: currentAudioSource === 'local'
                  ? '#22c55e'
                  : currentAudioSource === 'get'
                    ? '#3b82f6'
                    : 'var(--text-muted)',
                background: 'var(--bg-primary)',
              }}
              title={t.music.audioSource[currentAudioSource]}
            >
              {t.music.audioSource[currentAudioSource]}
            </span>
            <button
              onClick={cyclePlayMode}
              className="p-1.5 sm:p-2 rounded-sm transition-colors hover:bg-[var(--bg-tertiary)]"
              style={{ border: PIXEL_BORDER, color: 'var(--accent-primary)' }}
              title={modeConfig.label}
            >
              <ModeIcon className="w-4 h-4" />
            </button>
            <VolumeControl
              volume={volume}
              isMuted={isMuted}
              onVolumeChange={setVolume}
              onToggleMute={toggleMuted}
              labels={{ mute: t.music.mute, unmute: t.music.unmute }}
              buttonClassName="p-1.5 sm:p-2"
              sliderClassName="hidden sm:block w-20 lg:w-28 h-2"
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
