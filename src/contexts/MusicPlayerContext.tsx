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

// Playlist type definitions
export interface LyricLine {
  time?: number;
  text: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  src: string;
  cover?: string;
  lyrics?: LyricLine[];
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

export type VisualizerMode = 'bars' | 'wave' | 'heatmap';

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
  visualizerMode: VisualizerMode;
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
  changeVisualizer: () => void;
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
  const [visualizerMode, setVisualizerMode] =
    useState<VisualizerMode>('bars');
  const [playMode, setPlayMode] = useState<PlayMode>('shuffle');
  const [showLyrics, setShowLyrics] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  // Defer audio loading until first user interaction to avoid 404 storms
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [systemPaused, setSystemPaused] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const failedSrcsRef = useRef<Set<string>>(new Set());
  const prevPlayModeRef = useRef<PlayMode>('shuffle');
  // Distinguish user-initiated pause from system-initiated pause.
  const userPausedRef = useRef(false);

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

  // Initialise the single shared audio element
  useEffect(() => {
    if (!isDesktopClient) return;

    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = volume;
    audioRef.current = audio;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handleEnded = () => handleNextRef.current();
    const handleError = () => {
      const failedSrc = audio.currentSrc || audio.src;
      if (failedSrc && !failedSrcsRef.current.has(failedSrc)) {
        failedSrcsRef.current.add(failedSrc);
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[MusicPlayer] audio load failed: ${failedSrc}`);
        }
      }
      setError('Audio resource unavailable');
      setIsLoading(false);
      setIsPlaying(false);
    };
    const handleCanPlay = () => setIsLoading(false);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => {
      setIsLoading(false);
      setSystemPaused(false);
    };
    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        setBuffered(bufferedEnd);
      }
    };
    const handlePause = () => {
      // If the pause was not triggered by the user, treat it as a system pause.
      if (!userPausedRef.current && isPlaying) {
        setSystemPaused(true);
      }
      setIsPlaying(false);
      userPausedRef.current = false;
    };
    const handleSuspend = () => {
      if (isPlaying) {
        setSystemPaused(true);
        setIsPlaying(false);
      }
    };
    const handleStalled = () => setIsLoading(true);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('progress', handleProgress);
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
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('suspend', handleSuspend);
      audio.removeEventListener('stalled', handleStalled);
      audio.pause();
      audio.src = '';
      if (preloadRef.current) {
        preloadRef.current.pause();
        preloadRef.current.src = '';
      }
    };
  }, [isDesktopClient]);

  // Load current track after user interaction
  useEffect(() => {
    if (!audioRef.current || !isDesktopClient || !hasUserInteracted) return;

    const audio = audioRef.current;
    setIsLoading(true);
    setError(null);
    setCurrentTime(0);
    setBuffered(0);

    if (currentSong.src && failedSrcsRef.current.has(currentSong.src)) {
      setError('Audio resource unavailable');
      setIsLoading(false);
      setIsPlaying(false);
      return;
    }

    audio.src = currentSong.src;
    audio.load();

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setIsPlaying(false);
          setIsLoading(false);
        });
      }
    }
  }, [currentIndex, isDesktopClient, hasUserInteracted, currentSong.src]);

  // Play / pause whenever the playing flag changes
  useEffect(() => {
    if (!audioRef.current || !isDesktopClient) return;

    const audio = audioRef.current;
    if (isPlaying) {
      if (currentSong.src && failedSrcsRef.current.has(currentSong.src)) {
        setIsPlaying(false);
        return;
      }
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => setIsPlaying(false));
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, isDesktopClient, currentSong.src]);

  // Volume / mute synchronisation
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Preload next track
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
    if (!nextSong?.src || failedSrcsRef.current.has(nextSong.src)) return;

    if (!preloadRef.current) {
      preloadRef.current = new Audio();
      preloadRef.current.preload = 'auto';
    }
    if (preloadRef.current.src !== nextSong.src) {
      preloadRef.current.src = nextSong.src;
      preloadRef.current.load();
    }
  }, [currentPosition, shuffledOrder, playlist, isDesktopClient, hasUserInteracted]);

  const togglePlay = useCallback(() => {
    setHasUserInteracted(true);
    setIsOpen(true);
    setSystemPaused(false);
    setIsPlaying((prev) => {
      if (error) {
        setError(null);
        failedSrcsRef.current.delete(currentSong.src);
        if (audioRef.current) {
          audioRef.current.src = currentSong.src;
          audioRef.current.load();
        }
        return true;
      }
      // Mark the next pause as user-initiated when switching to paused state.
      if (prev) {
        userPausedRef.current = true;
      }
      return !prev;
    });
  }, [error, currentSong.src]);

  const next = useCallback(() => {
    if (playlist.length === 0) return;

    if (playMode === 'repeat') {
      // Replay the current track from the beginning
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        const promise = audioRef.current.play();
        if (promise !== undefined) {
          promise.catch(() => setIsPlaying(false));
        }
      }
      setCurrentTime(0);
      return;
    }

    setCurrentPosition((prev) => {
      const nextPosition = prev + 1;
      if (nextPosition >= shuffledOrder.length) {
        if (playMode === 'sequential') {
          // Stop at the end of the playlist
          return prev;
        }
        const newOrder = shuffleArray(playlist.length);
        setShuffledOrder(newOrder);
        return 0;
      }
      return nextPosition;
    });
  }, [shuffledOrder.length, playlist.length, playMode]);

  const prev = useCallback(() => {
    if (playlist.length === 0) return;
    setCurrentPosition((prevPos) =>
      prevPos <= 0 ? shuffledOrder.length - 1 : prevPos - 1
    );
  }, [shuffledOrder.length]);

  const playSong = useCallback(
    (id: string) => {
      const targetIndex = playlist.findIndex((s) => s.id === id);
      if (targetIndex === -1) return;
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
      setIsPlaying(true);
      setIsOpen(true);
      setHasUserInteracted(true);
    },
    [playlist, shuffledOrder]
  );

  const handleNextRef = useRef<() => void>(() => {});
  useEffect(() => {
    handleNextRef.current = next;
  }, [next]);

  const changeVisualizer = useCallback(() => {
    setVisualizerMode((prev) =>
      prev === 'bars' ? 'wave' : prev === 'wave' ? 'heatmap' : 'bars'
    );
  }, []);

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
      visualizerMode,
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
      changeVisualizer,
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
      visualizerMode,
      playlistLoading,
      playlist,
      playMode,
      showLyrics,
      showPlaylist,
      systemPaused,
      togglePlay,
      next,
      prev,
      changeVisualizer,
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
