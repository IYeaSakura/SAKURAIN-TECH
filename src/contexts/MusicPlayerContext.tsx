'use client';

/**
 * MusicPlayerContext — global audio playback state.
 *
 * Centralises the audio element, playlist playback-order logic and playback
 * controls so multiple UI surfaces (the floating player and the dedicated
 * music page) can stay perfectly in sync without prop drilling.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useConfig, useIsDesktopClient } from '@/hooks';
import { fetchLyrics, type LyricLine } from '@/lib/lyrics';
import {
  getCachedAudioUrl,
  resolveOriginalSrc,
  revokeBlobUrl,
} from '@/lib/asset-cache';
import {
  initAudioConnection,
  resumeAudioContext,
} from '@/components/MusicPlayer/AudioVisualizer';

// Playlist type definitions
export interface Song {
  id: string;
  title: string;
  artist: string;
  src: string;
  cover?: string;
  lyricUrl?: string;
}

interface PlaylistConfig {
  songs: Song[];
}

export type PlayMode = 'shuffle' | 'repeat' | 'sequential';

// Fisher-Yates shuffle
const shuffleArray = (length: number): number[] => {
  const array = Array.from({ length }, (_, i) => i);
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const sequentialOrder = (length: number): number[] =>
  Array.from({ length }, (_, i) => i);

// Normalise audio src values so absolute element URLs can be compared with
// the relative paths stored in the playlist. Blob URLs created by the asset
// cache are mapped back to their original COS URL first.
const resolveAudioSrc = (src: string): string => {
  if (typeof window === 'undefined' || !src) return src;
  const originalSrc = resolveOriginalSrc(src);
  try {
    return new URL(originalSrc, window.location.href).pathname;
  } catch {
    return originalSrc;
  }
};

const isSameAudioSource = (audioSrc: string, songSrc: string): boolean =>
  resolveAudioSrc(audioSrc) === resolveAudioSrc(songSrc);

interface MusicPlayerState {
  isOpen: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  error: string | null;
  isLoading: boolean;
  buffered: number;
  currentNumber: number;
  totalSongs: number;
  currentSong: Song;
  currentLyrics: LyricLine[];
  lyricsLoading: boolean;
  playlistLoading: boolean;
  playlist: Song[];
  playMode: PlayMode;
  showLyrics: boolean;
  showPlaylist: boolean;
  systemPaused: boolean;
}

interface MusicPlayerActions {
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  open: () => void;
  close: () => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
  seek: (time: number) => void;
  playSong: (id: string) => void;
  cyclePlayMode: () => void;
  toggleLyrics: () => void;
  togglePlaylist: () => void;
}

interface MusicPlayerContextValue extends MusicPlayerState, MusicPlayerActions {
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const DEFAULT_SONG: Song = { id: '', title: '', artist: '', src: '' };

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

export function MusicPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDesktopClient = useIsDesktopClient();
  const { data: playlistConfig, loading: playlistLoading } =
    useConfig<PlaylistConfig>('/data/playlist.json');
  const playlist = playlistConfig?.songs || [];

  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [shuffledOrder, setShuffledOrder] = useState<number[]>([]);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [playMode, setPlayMode] = useState<PlayMode>('shuffle');
  const [showLyrics, setShowLyrics] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  // Defer audio loading until first user interaction to avoid 404 storms
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [systemPaused, setSystemPaused] = useState(false);
  const [currentLyrics, setCurrentLyrics] = useState<LyricLine[]>([]);
  const [lyricsLoading, setLyricsLoading] = useState(false);

  // Keep refs in sync with the latest state for synchronous reads in handlers.
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const currentPositionRef = useRef(currentPosition);
  useEffect(() => {
    currentPositionRef.current = currentPosition;
  }, [currentPosition]);

  const shuffledOrderRef = useRef(shuffledOrder);
  useEffect(() => {
    shuffledOrderRef.current = shuffledOrder;
  }, [shuffledOrder]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);
  const preloadBlobUrlRef = useRef<string | null>(null);
  const failedSrcsRef = useRef<Set<string>>(new Set());
  const prevPlayModeRef = useRef<PlayMode>('shuffle');
  // Tracks whether playback is intended to be active. Distinguishes user pause
  // from system pause and preserves play intent across track changes.
  const intendedPlayingRef = useRef(false);
  // Suppress pause/abort events emitted while swapping audio src. Held true
  // from the moment src changes until the new track fires 'playing' or 'error'.
  const trackChangeRef = useRef(false);
  // Mirror of isPlaying for event handlers so they see the latest state without
  // recreating the audio element.
  const isPlayingRef = useRef(isPlaying);

  // Build shuffle order once the playlist is known
  useEffect(() => {
    if (playlist.length > 0 && shuffledOrder.length === 0) {
      setShuffledOrder(shuffleArray(playlist.length));
    }
  }, [playlist.length, shuffledOrder.length]);

  // Adjust playback order when the mode changes
  useEffect(() => {
    if (playlist.length === 0) return;
    if (prevPlayModeRef.current === playMode) return;
    prevPlayModeRef.current = playMode;

    const currentIdx = shuffledOrder[currentPosition];
    if (playMode === 'sequential') {
      setShuffledOrder(sequentialOrder(playlist.length));
      setCurrentPosition(currentIdx ?? 0);
    } else if (playMode === 'shuffle') {
      const newOrder = shuffleArray(playlist.length);
      const pos =
        currentIdx !== undefined
          ? newOrder.findIndex((idx) => idx === currentIdx)
          : 0;
      setShuffledOrder(newOrder);
      setCurrentPosition(pos >= 0 ? pos : 0);
    }
  }, [playMode, playlist.length, shuffledOrder, currentPosition]);

  const currentIndex = shuffledOrder[currentPosition] ?? 0;
  const currentSong = playlist[currentIndex] || DEFAULT_SONG;
  const currentNumber = currentPosition + 1;
  const totalSongs = playlist.length;

  // Fetch lyrics from the external COS URL whenever the current track changes.
  useEffect(() => {
    let cancelled = false;
    setLyricsLoading(true);
    fetchLyrics(currentSong.lyricUrl).then((lyrics) => {
      if (cancelled) return;
      setCurrentLyrics(lyrics);
      setLyricsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [currentSong.lyricUrl]);

  // Mirror of the current song so event handlers can verify which resource
  // the element is actually playing without recreating listeners.
  const currentSongRef = useRef(currentSong);
  // Synchronise the ref immediately during render so event handlers fired
  // between the src change and the effect flush always see the latest song.
  if (currentSongRef.current.src !== currentSong.src) {
    currentSongRef.current = currentSong;
  }
  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  // Initialise the single shared audio element
  useEffect(() => {
    if (!isDesktopClient) return;

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'metadata';
    audio.volume = volume;
    audioRef.current = audio;

    // Set up the shared Web Audio analyser connection immediately so
    // visualizers always find a ready-made connection in globalAudioMap.
    initAudioConnection(audio);

    const handleTimeUpdate = () => {
      const src = audio.currentSrc || audio.src;
      if (!isSameAudioSource(src, currentSongRef.current.src)) return;
      setCurrentTime(audio.currentTime);
    };
    const handleLoadedMetadata = () => {
      const src = audio.currentSrc || audio.src;
      if (!isSameAudioSource(src, currentSongRef.current.src)) return;
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handleEnded = () => handleNextRef.current();
    const handleError = () => {
      // Errors raised during a transition belong to the old resource and must
      // not stop the newly requested track.
      if (trackChangeRef.current) return;

      const failedSrc = audio.currentSrc || audio.src;
      // Ignore errors raised by a previous resource after we have already
      // moved on to another track.
      if (!isSameAudioSource(failedSrc, currentSongRef.current.src)) return;

      const mediaError = audio.error;
      const errorDetails = mediaError
        ? `code ${mediaError.code}${mediaError.message ? `: ${mediaError.message}` : ''}`
        : 'unknown';

      if (
        failedSrc &&
        !failedSrcsRef.current.has(resolveAudioSrc(failedSrc))
      ) {
        failedSrcsRef.current.add(resolveAudioSrc(failedSrc));
        console.warn(`[MusicPlayer] audio load failed: ${failedSrc} (${errorDetails})`);
      }
      setError('Audio resource unavailable');
      setIsLoading(false);
      // A failed current resource ends the transition and clears playback intent.
      trackChangeRef.current = false;
      intendedPlayingRef.current = false;
      setIsPlaying(false);
    };
    const handleCanPlay = () => {
      const src = audio.currentSrc || audio.src;
      if (!isSameAudioSource(src, currentSongRef.current.src)) return;
      setIsLoading(false);
    };
    const handleWaiting = () => {
      const src = audio.currentSrc || audio.src;
      if (!isSameAudioSource(src, currentSongRef.current.src)) return;
      setIsLoading(true);
    };
    const handlePlay = () => {
      const src = audio.currentSrc || audio.src;
      if (!isSameAudioSource(src, currentSongRef.current.src)) return;
      // The 'play' event fires as soon as playback is requested. Update the
      // UI immediately but keep the transition lock active so any delayed
      // pause / abort events from the previous track are still ignored.
      setIsLoading(false);
      setSystemPaused(false);
      setIsPlaying(true);
    };
    const handlePlaying = () => {
      const src = audio.currentSrc || audio.src;
      if (!isSameAudioSource(src, currentSongRef.current.src)) return;
      // If the user already paused during the transition, do not resurrect
      // playback state from the buffered 'playing' event.
      if (audio.paused) return;
      // The 'playing' event confirms the new track is actually producing
      // audio. Release the transition lock and reflect the real playing state.
      trackChangeRef.current = false;
      setIsLoading(false);
      setSystemPaused(false);
      setIsPlaying(true);
    };
    const handleProgress = () => {
      const src = audio.currentSrc || audio.src;
      if (!isSameAudioSource(src, currentSongRef.current.src)) return;
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        setBuffered(bufferedEnd);
      }
    };
    const handleAbort = () => {
      // A load abort is expected during track changes when src is swapped.
      if (trackChangeRef.current) return;
      // If the element is currently playing, this event belongs to an
      // already-discarded resource and should not pause the active track.
      if (!audio.paused) return;
      const src = audio.currentSrc || audio.src;
      if (!isSameAudioSource(src, currentSongRef.current.src)) return;
      if (intendedPlayingRef.current) {
        setSystemPaused(true);
      }
      setIsPlaying(false);
    };
    const handlePause = () => {
      // A genuine pause event always leaves the element paused. If playback
      // is active, this is a stale event from a previous track and must be
      // ignored so the next song is not accidentally stopped.
      if (!audio.paused) return;
      // Changing the audio src implicitly pauses the element. Ignore that
      // synthetic pause so the playback state is preserved for the new track.
      if (trackChangeRef.current) return;
      const src = audio.currentSrc || audio.src;
      if (!isSameAudioSource(src, currentSongRef.current.src)) return;
      setIsPlaying(false);
      // If we still intend to play, this pause came from the system (suspend,
      // stall, browser policy) rather than the user, so show the resume hint.
      if (intendedPlayingRef.current) {
        setSystemPaused(true);
      }
    };
    const handleSuspend = () => {
      // Ignore suspend events that are part of a track change (e.g. the old
      // resource being suspended while the new src loads).
      if (trackChangeRef.current) return;
      if (!audio.paused) return;
      const src = audio.currentSrc || audio.src;
      if (!isSameAudioSource(src, currentSongRef.current.src)) return;
      setIsPlaying(false);
      if (intendedPlayingRef.current) {
        setSystemPaused(true);
      }
    };
    const handleStalled = () => {
      const src = audio.currentSrc || audio.src;
      if (!isSameAudioSource(src, currentSongRef.current.src)) return;
      setIsLoading(true);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('abort', handleAbort);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('suspend', handleSuspend);
    audio.addEventListener('stalled', handleStalled);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('abort', handleAbort);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('suspend', handleSuspend);
      audio.removeEventListener('stalled', handleStalled);
      audio.pause();
      audio.src = '';
      if (audioBlobUrlRef.current) {
        revokeBlobUrl(audioBlobUrlRef.current);
        audioBlobUrlRef.current = null;
      }
      if (preloadRef.current) {
        preloadRef.current.pause();
        preloadRef.current.src = '';
      }
      if (preloadBlobUrlRef.current) {
        revokeBlobUrl(preloadBlobUrlRef.current);
        preloadBlobUrlRef.current = null;
      }
    };
  }, [isDesktopClient]);

  // Load current track after user interaction, using the persistent asset
  // cache for COS-hosted audio files.
  useEffect(() => {
    if (!audioRef.current || !isDesktopClient || !hasUserInteracted) return;
    if (!currentSong.src) return;

    let cancelled = false;
    const audio = audioRef.current;

    (async () => {
      // Avoid redundant reloads when the same source is already bound. This
      // prevents a race where rapid state updates abort an in-flight play()
      // promise and incorrectly flip isPlaying back to false.
      if (
        isSameAudioSource(audio.src, currentSong.src) &&
        !failedSrcsRef.current.has(resolveAudioSrc(currentSong.src))
      ) {
        if (intendedPlayingRef.current && audio.paused) {
          // Re-using the current resource can still emit pause/abort events
          // from the previous playback state. Hold the transition lock until
          // playback actually resumes so those stale events are ignored.
          trackChangeRef.current = true;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch((err: unknown) => {
              if ((err as Error | undefined)?.name === 'AbortError') return;
              trackChangeRef.current = false;
              intendedPlayingRef.current = false;
              setIsPlaying(false);
              setIsLoading(false);
            });
          }
        } else {
          // No transition is happening; release the lock so subsequent pause
          // events are handled normally.
          trackChangeRef.current = false;
        }
        return;
      }

      if (failedSrcsRef.current.has(resolveAudioSrc(currentSong.src))) {
        trackChangeRef.current = false;
        intendedPlayingRef.current = false;
        setError('Audio resource unavailable');
        setIsLoading(false);
        setIsPlaying(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setCurrentTime(0);
      setBuffered(0);

      const cachedSrc = await getCachedAudioUrl(currentSong.src);
      if (cancelled) return;

      // Mark that we are about to swap src so the implicit pause/abort events
      // from the previous resource are ignored.
      trackChangeRef.current = true;

      // Revoke the previous blob URL only after the new src is ready.
      if (audioBlobUrlRef.current && audioBlobUrlRef.current !== cachedSrc) {
        revokeBlobUrl(audioBlobUrlRef.current);
        audioBlobUrlRef.current = null;
      }

      audio.src = cachedSrc;
      if (cachedSrc !== currentSong.src) {
        audioBlobUrlRef.current = cachedSrc;
      }
      audio.load();

      // Auto-play the new track when playback is intended. Keep the transition
      // lock active until the 'playing' event confirms the new resource is
      // actually producing audio.
      if (intendedPlayingRef.current) {
        resumeAudioContext(audio);
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err: unknown) => {
            // A newer load() can abort this play attempt; ignore those errors.
            if ((err as Error | undefined)?.name === 'AbortError') return;
            console.warn('[MusicPlayer] play() after load failed:', err);
            trackChangeRef.current = false;
            intendedPlayingRef.current = false;
            setIsPlaying(false);
            setIsLoading(false);
          });
        }
      } else {
        trackChangeRef.current = false;
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentIndex, currentPosition, isDesktopClient, hasUserInteracted, currentSong.src]);

  // Play / pause whenever the playing flag changes. The load-track effect
  // already handles playback when the track changes, so this effect is skipped
  // while a transition is in progress.
  useEffect(() => {
    if (!audioRef.current || !isDesktopClient) return;

    const audio = audioRef.current;
    if (isPlaying) {
      if (trackChangeRef.current) return;
      if (!audio.paused) return;
      resumeAudioContext(audio);
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err: unknown) => {
          // Ignore aborts caused by a concurrent track change.
          if ((err as Error | undefined)?.name === 'AbortError') return;
          console.warn('[MusicPlayer] play() failed:', err);
          intendedPlayingRef.current = false;
          setIsPlaying(false);
        });
      }
    } else {
      if (!audio.paused) {
        audio.pause();
      }
    }
  }, [isPlaying, isDesktopClient]);

  // Volume / mute synchronisation
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Preload next track through the persistent cache.
  useEffect(() => {
    if (
      !isDesktopClient ||
      !hasUserInteracted ||
      playlist.length === 0 ||
      shuffledOrder.length === 0
    )
      return;

    const nextPosition = currentPosition + 1;
    const nextIndex =
      nextPosition >= shuffledOrder.length ? shuffledOrder[0] : shuffledOrder[nextPosition];
    const nextSong = playlist[nextIndex];
    if (!nextSong?.src || failedSrcsRef.current.has(resolveAudioSrc(nextSong.src))) return;

    let cancelled = false;

    (async () => {
      const cachedSrc = await getCachedAudioUrl(nextSong.src);
      if (cancelled) return;

      if (!preloadRef.current) {
        preloadRef.current = new Audio();
        preloadRef.current.crossOrigin = 'anonymous';
        preloadRef.current.preload = 'auto';
      }
      if (preloadRef.current.src !== cachedSrc) {
        // Revoke the previous preload blob URL before replacing it.
        if (preloadBlobUrlRef.current && preloadBlobUrlRef.current !== cachedSrc) {
          revokeBlobUrl(preloadBlobUrlRef.current);
          preloadBlobUrlRef.current = null;
        }
        preloadRef.current.src = cachedSrc;
        if (cachedSrc !== nextSong.src) {
          preloadBlobUrlRef.current = cachedSrc;
        }
        preloadRef.current.load();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentPosition, shuffledOrder, playlist, isDesktopClient, hasUserInteracted]);

  const togglePlay = useCallback(() => {
    setHasUserInteracted(true);
    setIsOpen(true);
    setSystemPaused(false);
    // Resume Web Audio synchronously inside the user gesture so browsers do
    // not keep the AudioContext suspended after the first interaction.
    resumeAudioContext(audioRef.current);
    setIsPlaying((prev) => {
      const next = !prev;
      intendedPlayingRef.current = next;
      if (error) {
        setError(null);
        failedSrcsRef.current.delete(resolveAudioSrc(currentSong.src));
      }
      return next;
    });
  }, [error, currentSong.src]);

  const next = useCallback(() => {
    if (playlist.length === 0) return;
    setHasUserInteracted(true);
    setSystemPaused(false);
    // A manual track change expresses intent to keep playback active.
    intendedPlayingRef.current = true;
    resumeAudioContext(audioRef.current);

    if (playMode === 'repeat') {
      // Replay the current track from the beginning. No src change happens
      // here, so there is no implicit pause event to suppress.
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        const promise = audioRef.current.play();
        if (promise !== undefined) {
          promise.catch((err: unknown) => {
            if ((err as Error | undefined)?.name === 'AbortError') return;
            intendedPlayingRef.current = false;
            setIsPlaying(false);
          });
        }
      }
      setCurrentTime(0);
      return;
    }

    // In sequential mode, stop when the playlist reaches its end.
    const nextPos = currentPositionRef.current + 1;
    if (nextPos >= shuffledOrderRef.current.length && playMode === 'sequential') {
      intendedPlayingRef.current = false;
      setIsPlaying(false);
      return;
    }

    // Track changes always suppress pause events until the new track plays.
    trackChangeRef.current = true;
    setIsPlaying(true);
    setCurrentPosition((prev) => {
      const computedNext = prev + 1;
      if (computedNext >= shuffledOrderRef.current.length) {
        const currentIdx = shuffledOrderRef.current[prev];
        const newOrder = shuffleArray(playlist.length);
        // Ensure the next loop starts with a different track when possible,
        // otherwise the current index would not change and the audio effect
        // would not reload, leaving playback paused.
        if (playlist.length > 1 && newOrder[0] === currentIdx) {
          const swapIndex = Math.floor(Math.random() * (newOrder.length - 1)) + 1;
          [newOrder[0], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[0]];
        }
        setShuffledOrder(newOrder);
        return 0;
      }
      return computedNext;
    });
  }, [playlist.length, playMode]);

  const prev = useCallback(() => {
    if (playlist.length === 0) return;
    setHasUserInteracted(true);
    setSystemPaused(false);
    intendedPlayingRef.current = true;
    resumeAudioContext(audioRef.current);
    trackChangeRef.current = true;
    setIsPlaying(true);
    setCurrentPosition((prevPos) =>
      prevPos <= 0 ? shuffledOrderRef.current.length - 1 : prevPos - 1
    );
  }, [playlist.length]);

  const playSong = useCallback(
    (id: string) => {
      const targetIndex = playlist.findIndex((s) => s.id === id);
      if (targetIndex === -1) return;
      intendedPlayingRef.current = true;
      resumeAudioContext(audioRef.current);
      trackChangeRef.current = true;
      setIsPlaying(true);
      const targetPosition = shuffledOrder.findIndex((idx) => idx === targetIndex);
      if (targetPosition !== -1) {
        setCurrentPosition(targetPosition);
      } else {
        // Re-shuffle so the requested song is next.
        const newOrder = shuffleArray(playlist.length);
        const pos = newOrder.findIndex((idx) => idx === targetIndex);
        setShuffledOrder(newOrder);
        setCurrentPosition(pos >= 0 ? pos : 0);
      }
      setIsOpen(true);
      setHasUserInteracted(true);
    },
    [playlist, shuffledOrder]
  );

  const handleNextRef = useRef<() => void>(() => {});
  useEffect(() => {
    handleNextRef.current = next;
  }, [next]);

  const cyclePlayMode = useCallback(() => {
    setPlayMode((prev) =>
      prev === 'shuffle' ? 'repeat' : prev === 'repeat' ? 'sequential' : 'shuffle'
    );
  }, []);

  const toggleLyrics = useCallback(() => {
    setShowLyrics((prev) => !prev);
  }, []);

  const togglePlaylist = useCallback(() => {
    setShowPlaylist((prev) => !prev);
  }, []);

  const seek = useCallback((time: number) => {
    if (!audioRef.current || !duration) return;
    const clamped = Math.max(0, Math.min(duration, time));
    audioRef.current.currentTime = clamped;
    setCurrentTime(clamped);
  }, [duration]);

  const value = useMemo<MusicPlayerContextValue>(
    () => ({
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
      lyricsLoading,
      playlistLoading,
      playlist,
      playMode,
      showLyrics,
      showPlaylist,
      systemPaused,
      togglePlay,
      next,
      prev,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      setVolume: setVolumeState,
      setMuted: setIsMuted,
      toggleMuted: () => setIsMuted((m) => !m),
      seek,
      playSong,
      cyclePlayMode,
      toggleLyrics,
      togglePlaylist,
      audioRef,
    }),
    [
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
      lyricsLoading,
      playlistLoading,
      playlist,
      playMode,
      showLyrics,
      showPlaylist,
      systemPaused,
      togglePlay,
      next,
      prev,
      seek,
      playSong,
      cyclePlayMode,
      toggleLyrics,
      togglePlaylist,
    ]
  );

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer(): MusicPlayerContextValue {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) {
    throw new Error(
      'useMusicPlayer must be used within a MusicPlayerProvider'
    );
  }
  return ctx;
}
