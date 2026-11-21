'use client';

/**
 * Global music player —— brutalism / pixel style.
 *
 * Fixed to the bottom-right corner; playback continues across page navigations.
 * Supports shuffle / repeat-one / sequential modes, expandable playlist and a
 * bottom lyrics line. Hidden on /music since the music page provides its own
 * full controls.
 */

import { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ListMusic, Mic2, Pause, Play, X } from 'lucide-react';
import styles from './player.module.css';
import { useAnimationEnabled, useMusicPlayer, useStylePreset, useTranslation } from '@/hooks';
import { ProgressSlider } from './shared/ProgressSlider';
import { TransportControls } from './shared/TransportControls';
import { VolumeControl } from './shared/VolumeControl';
import { PlaylistItem } from './shared/PlaylistItem';
import { TrackArt } from './shared/TrackArt';
import { formatTime, getActiveLyric, getModeConfig } from './shared/player-utils';
import type { Song } from '@/contexts/MusicPlayerContext';


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
      className="border-t-2 mt-3 max-h-48 overflow-y-auto overscroll-contain"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      {playlist.map((song, index) => (
        <PlaylistItem
          key={song.id}
          song={song}
          index={index}
          isCurrent={song.id === currentSong.id}
          isLast={index === playlist.length - 1}
          onSelect={onSelect}
          variant="mini"
        />
      ))}
    </div>
  );
}

export function MusicPlayer() {
  const animationEnabled = useAnimationEnabled();
  const player = useMusicPlayer();
  const pathname = usePathname();
  const { preset } = useStylePreset();
  const { t, tReplace } = useTranslation();
  const isMusicPage = pathname === '/music';
  const isTerminalMode = preset.id === 'terminal';
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
    currentLyrics,
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
    currentAudioSource,
    toggleLyrics,
    togglePlaylist,
  } = player;

  const activeLyric = useMemo(
    () => getActiveLyric(currentLyrics, currentTime),
    [currentLyrics, currentTime]
  );
  const progressPercent = duration ? Math.min(100, (currentTime / duration) * 100) : 0;

  // Skip rendering on mobile, while loading playlist, on the music page,
  // in terminal mode, or when playlist is empty
  if (!isClient || playlistLoading || totalSongs === 0 || isMusicPage || isTerminalMode) return null;

  const modeConfig = getModeConfig(playMode, {
    shuffle: t.music.shuffle,
    repeat: t.music.repeat,
    sequential: t.music.sequential,
  });

  const ModeIcon = modeConfig.icon;

  return (
    <>
      {!isOpen ? (
        /* Collapsed mini player */
        <motion.div
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed right-4 sm:right-6 z-[100]"
          // Keep the player above the iOS home indicator.
          style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <motion.button
            onClick={open}
            whileTap={{ scale: 0.97 }}
            className={`${styles.miniButton} ${isPlaying ? styles.miniButtonPlaying : ''}`}
            aria-label={currentSong.title}
          >
            <TrackArt song={currentSong} isPlaying={isPlaying} className="w-10 h-10" />

            <div className="flex flex-col items-start flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5 w-full">
                <span
                  className={`${styles.statusDot} ${isPlaying ? styles.statusDotLive : ''}`}
                  aria-hidden="true"
                />
                <span
                  className="text-xs font-bold max-w-[112px] truncate"
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                >
                  {currentSong.title}
                </span>
              </div>
              <span className="text-[10px] max-w-[128px] truncate" style={{ color: 'var(--text-muted)' }}>
                {isLoading
                  ? t.music.loading
                  : error
                    ? t.music.unavailable
                    : isPlaying
                      ? `${t.music.playing} · ${t.music.audioSource[currentAudioSource]}`
                      : `${currentNumber}/${totalSongs} · ${t.music.audioSource[currentAudioSource]}`}
              </span>
            </div>

            <span
              className={`${styles.iconButton} p-1.5`}
              style={{ color: 'var(--accent-primary)' }}
              aria-hidden="true"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </span>

            <span className={styles.microProgress} aria-hidden="true">
              <span className={styles.microProgressFill} style={{ width: `${progressPercent}%` }} />
            </span>
          </motion.button>
        </motion.div>
      ) : (
        /* Expanded player panel */
        <motion.div
          initial={animationEnabled ? { opacity: 0, y: 20 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed right-4 sm:right-6 z-[100] w-[min(300px,calc(100vw-2rem))]"
          style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className={`${styles.panel} overflow-hidden`}>
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
                  className={`${styles.iconButton} p-1.5`}
                  style={{ color: 'var(--text-muted)' }}
                  title={t.music.playMode}
                >
                  <ModeIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={togglePlaylist}
                  className={`${styles.iconButton} ${showPlaylist ? styles.iconButtonActive : ''} p-1.5`}
                  style={{ color: showPlaylist ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                  title={t.music.playlist}
                >
                  <ListMusic className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleLyrics}
                  className={`${styles.iconButton} ${showLyrics ? styles.iconButtonActive : ''} p-1.5`}
                  style={{ color: showLyrics ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                  title={t.music.bottomLyrics}
                >
                  <Mic2 className="w-4 h-4" />
                </button>
                <button
                  onClick={close}
                  className={`${styles.iconButton} p-1.5`}
                  style={{ color: 'var(--text-muted)' }}
                  title={t.music.collapse}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Track info */}
            <div className="px-4 py-4">
              <div className="flex items-center gap-3">
                <TrackArt song={currentSong} isPlaying={isPlaying} className="w-14 h-14" />
                <div className="flex-1 min-w-0">
                  <span className={`${styles.chip} ${styles.chipAccent} mb-1`}>
                    {isPlaying ? t.music.playing : currentNumber + '/' + totalSongs}
                  </span>
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

              {/* Inline lyrics line */}
              <AnimatePresence>
                {showLyrics && activeLyric && (
                  <motion.div
                    initial={animationEnabled ? { opacity: 0, height: 0 } : undefined}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div
                      className={`${styles.chip} ${styles.chipAccent} mt-3 w-full justify-center px-2 py-1.5 text-center text-xs`}
                    >
                      <span className="truncate">{activeLyric}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error message */}
              {error && (
                <div
                  className="mt-2 text-xs text-center p-2 rounded-sm cursor-pointer border-2"
                  style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)', color: 'var(--error)' }}
                  onClick={togglePlay}
                >
                  {tReplace(t.music.clickToRetry, { error })}
                </div>
              )}

              {/* Progress */}
              <div className="mt-4">
                <ProgressSlider
                  currentTime={currentTime}
                  duration={duration}
                  buffered={buffered}
                  onSeek={seek}
                  className="h-2.5"
                />
                <div className="flex justify-between mt-1 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <TransportControls
                isPlaying={isPlaying}
                isLoading={isLoading}
                hasError={Boolean(error)}
                onPrev={prev}
                onTogglePlay={togglePlay}
                onNext={next}
                labels={{ previous: t.music.previous, next: t.music.next }}
                containerClassName="flex items-center justify-center gap-3 mt-3"
                sideClassName="p-2"
                mainClassName="p-3"
              />

              {/* Volume */}
              <div className="flex items-center gap-2 mt-3">
                <VolumeControl
                  volume={volume}
                  isMuted={isMuted}
                  onVolumeChange={setVolume}
                  onToggleMute={toggleMuted}
                  labels={{ mute: t.music.mute, unmute: t.music.unmute }}
                  systemVolumeHint={t.music.systemVolume}
                  buttonClassName="p-1.5"
                  sliderClassName="flex-1 h-2"
                />
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-center gap-2 mt-3 pt-2 border-t-2"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <span
                  className={`${styles.chip} ${
                    currentAudioSource === 'local' || currentAudioSource === 'get'
                      ? styles.chipAccent
                      : ''
                  }`}
                >
                  {t.music.audioSource[currentAudioSource]}
                </span>
                <ModeIcon className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} />
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  {tReplace(t.music.trackInfo, { current: currentNumber, total: totalSongs, mode: playMode })}
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
