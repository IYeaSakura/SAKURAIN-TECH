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
  clearCorsProbeCache,
  getCachedAudioUrl,
  getCachedAudioUrlWithSource,
  isCorsSupported,
  protectAsset,
  resolveCacheKey,
  resolveOriginalSrc,
  revokeBlobUrl,
  type AudioSource,
  unprotectAsset,
  withCdnFallbacks,
} from '@/lib/asset-cache';
import {
  getAudioConnection,
  initAudioConnection,
  resumeAudioContext,
  disposeAudioConnection,
} from '@/components/MusicPlayer/shared/audio-analyser';

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

// Normalise audio src values so URLs from different CDN prefixes that point
// to the same file compare equal. Blob URLs created by the asset cache are
// mapped back to their normalized cache key first.
const resolveAudioSrc = (src: string): string => {
  if (typeof window === 'undefined' || !src) return src;
  const originalSrc = resolveOriginalSrc(src);
  return resolveCacheKey(originalSrc);
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
  currentAudioSource: AudioSource;
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
  const [currentAudioSource, setCurrentAudioSource] = useState<AudioSource>('direct');
  // Bumping this rebuilds the <audio> element. Required because a
  // MediaElementSource permanently redirects an element's output — after a
  // CORS downgrade the only way back to direct (non-silenced) output is a
  // fresh element. See handleError / handleOnline.
  const [audioEpoch, setAudioEpoch] = useState(0);

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
  // One CORS-downgrade attempt per concrete URL (original or mirror). Keyed by
  // raw URL, not the normalized path, so a mirror that does serve CORS headers
  // is still allowed to create an analyser after the original host failed.
  const corsDowngradedUrlsRef = useRef<Set<string>>(new Set());
  // Concrete URL currently in use for the active song. When the original CDN
  // host fails, the error handler advances this through the known mirrors.
  const [audioUrlOverride, setAudioUrlOverride] = useState<{
    songSrc: string;
    url: string;
  } | null>(null);
  // Every URL already tried for the active song, so mirror retries terminate.
  const triedAudioUrlsRef = useRef<Set<string>>(new Set());
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

  // Clear cached failures when the browser reconnects so previously failed
  // tracks can be retried over the new network path.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => {
      failedSrcsRef.current.clear();
      corsDowngradedUrlsRef.current.clear();
      // Drop the stale analyser so the spectrum can re-attach to a fresh CORS
      // connection on the next load. The audio element itself is rebuilt by
      // the epoch bump in handleError when needed; here we only clear the web
      // audio graph, whose suspended/tainted state cannot be reused.
      const hadConnection = Boolean(getAudioConnection(audioRef.current));
      disposeAudioConnection(audioRef.current);
      // A disposed MediaElementSource cannot be un-attached; rebuild the element
      // so the next load can establish a fresh analyser + direct output.
      if (hadConnection) {
        trackChangeRef.current = true;
        setAudioEpoch((e) => e + 1);
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

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

  // Each song gets a fresh set of CDN retry attempts. The override is keyed by
  // song src, so a stale mirror from the previous track is naturally ignored.
  useEffect(() => {
    triedAudioUrlsRef.current.clear();
  }, [currentSong.src]);

  // Initialise the single shared audio element
  useEffect(() => {
    if (!isDesktopClient) return;

    const audio = new Audio();
    // Start without CORS so playback works even for static-site/CDN edges that
    // do not serve Access-Control-Allow-Origin. CORS is enabled only after we
    // explicitly confirm the current resource supports it, because attaching a
    // MediaElementSource to a non-CORS element mutes the audio output.
    audio.crossOrigin = null;
    audio.preload = 'metadata';
    audio.volume = volume;
    audioRef.current = audio;

    // Do not create the Web Audio connection here. It is established only
    // after we confirm the CDN supports CORS for the current resource, avoiding
    // the silent-output bug that occurs when a MediaElementSource is attached
    // to a non-CORS media element.

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
      // Do NOT discard errors just because a track transition is in progress:
      // the new resource itself can fail while the lock is held until 'playing'.
      // The source comparison below already filters out stale old-resource
      // errors, so genuine failures still reach the mirror/CORS fallback.
      const failedSrc = audio.currentSrc || audio.src;
      // Ignore errors raised by a previous resource after we have already
      // moved on to another track.
      if (!isSameAudioSource(failedSrc, currentSongRef.current.src)) return;

      if (failedSrc) triedAudioUrlsRef.current.add(failedSrc);

      // If CORS mode failed, try the same URL without CORS once. Some CDN edges
      // do not serve Access-Control-Allow-Origin even though the file is
      // playable directly. Track the downgrade per concrete URL so a mirror
      // that does serve CORS headers can still drive an analyser.
      if (
        failedSrc &&
        audio.crossOrigin === 'anonymous' &&
        !corsDowngradedUrlsRef.current.has(failedSrc)
      ) {
        corsDowngradedUrlsRef.current.add(failedSrc);
        clearCorsProbeCache();
        setAudioUrlOverride({ songSrc: currentSongRef.current.src, url: failedSrc });
        // A MediaElementSource permanently redirects this element's output;
        // keeping it while switching to no-CORS would leave audio silenced.
        // Dispose the graph and rebuild a fresh, no-CORS element instead. The
        // load effect (keyed on audioEpoch) reloads and resumes automatically
        // because intendedPlayingRef is still true.
        disposeAudioConnection(audio);
        // Suppress abort/pause events emitted while the old element is torn
        // down; the reload effect owns the transition lock from here.
        trackChangeRef.current = true;
        setAudioEpoch((e) => e + 1);
        return;
      }

      // A host outage or a second failure should retry the same path on a
      // mirror CDN before the track is declared unavailable. Without this, a
      // first-time (GET) track depends entirely on one CDN host being healthy,
      // while cached tracks keep playing from IndexedDB.
      const candidates = withCdnFallbacks(currentSongRef.current.src);
      const nextUrl = candidates.find(
        (candidate) =>
          candidate !== failedSrc && !triedAudioUrlsRef.current.has(candidate)
      );
      if (nextUrl) {
        clearCorsProbeCache();
        trackChangeRef.current = true;
        setAudioUrlOverride({ songSrc: currentSongRef.current.src, url: nextUrl });
        setAudioEpoch((e) => e + 1);
        return;
      }

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
      // The MediaElementSource is tied to this element; tear down the Web
      // Audio graph before the element is discarded on an epoch rebuild.
      disposeAudioConnection(audio);
    };
  }, [isDesktopClient, audioEpoch]);

  // Load current track after user interaction, using the persistent asset
  // cache for COS-hosted audio files.
  useEffect(() => {
    if (!audioRef.current || !isDesktopClient || !hasUserInteracted) return;
    if (!currentSong.src) return;

    // Keep the current track in IndexedDB while it is loaded so LRU eviction
    // does not delete it mid-playback.
    protectAsset(currentSong.src);

    // Claim the transition lock SYNCHRONOUSLY, before any await. The isPlaying
    // effect below runs after this one; without the lock it calls play() while
    // the element still has no src, gets a NotSupportedError and clears the
    // user's play intent. That made first-time (GET) tracks silent with no
    // analyser data, while cached tracks appeared to work fine.
    trackChangeRef.current = true;

    let cancelled = false;
    const audio = audioRef.current;
    // A failed original URL is replaced by a mirror for this same song. The
    // override is ignored as soon as the selected song changes.
    const requestSrc =
      audioUrlOverride?.songSrc === currentSong.src
        ? audioUrlOverride.url
        : currentSong.src;

    (async () => {
      const failedKey = resolveAudioSrc(currentSong.src);
      if (failedSrcsRef.current.has(failedKey)) {
        trackChangeRef.current = false;
        intendedPlayingRef.current = false;
        setError('Audio resource unavailable');
        setIsLoading(false);
        setIsPlaying(false);
        return;
      }

      // When the CDN does not serve CORS headers for the current origin,
      // remove crossOrigin so playback can still work without the Web Audio
      // visualizer. A URL that already failed in CORS mode stays no-CORS;
      // mirrors are evaluated independently so a CORS-capable mirror can still
      // provide a spectrum.
      const alreadyDowngraded = corsDowngradedUrlsRef.current.has(requestSrc);
      const corsSupported = alreadyDowngraded ? false : await isCorsSupported(requestSrc);
      if (cancelled) return;
      audio.crossOrigin = corsSupported ? 'anonymous' : null;

      const { url: cachedSrc, source } = await getCachedAudioUrlWithSource(requestSrc);
      if (cancelled) return;
      setCurrentAudioSource(source);

      // Avoid redundant reloads when the exact resolved source is already
      // bound. Comparing the concrete URL (not a normalized path) is essential
      // here: after a host failure the mirror has the same path but a different
      // origin, and must actually be loaded instead of reusing the failed one.
      if (audio.src === cachedSrc) {
        initAudioConnection(audio);
        if (intendedPlayingRef.current && audio.paused) {
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
          trackChangeRef.current = false;
        }
        return;
      }

      setIsLoading(true);
      setError(null);
      setCurrentTime(0);
      setDuration(0);
      setBuffered(0);

      // Revoke the previous blob URL only after the new src is ready.
      if (audioBlobUrlRef.current && audioBlobUrlRef.current !== cachedSrc) {
        revokeBlobUrl(audioBlobUrlRef.current);
        audioBlobUrlRef.current = null;
      }

      audio.src = cachedSrc;
      if (cachedSrc !== requestSrc) {
        audioBlobUrlRef.current = cachedSrc;
      }
      audio.load();

      // src is now final (possibly a same-origin blob). Create the analyser
      // here so locally cached playback gets a working spectrum too.
      initAudioConnection(audio);

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
      // Release the protection for this track when switching to another song.
      unprotectAsset(currentSong.src);
    };
  }, [currentIndex, currentPosition, isDesktopClient, hasUserInteracted, currentSong.src, audioUrlOverride, audioEpoch]);

  // Play / pause whenever the playing flag changes. The load-track effect
  // already handles playback when the track changes, so this effect is skipped
  // while a transition is in progress.
  useEffect(() => {
    if (!audioRef.current || !isDesktopClient) return;

    const audio = audioRef.current;
    if (isPlaying) {
      if (trackChangeRef.current) return;
      // The playlist may still be loading. Calling play() on an element with
      // no src rejects and clears play intent; the load effect owns playback
      // until a matching src has actually been attached.
      if (!audio.src || !isSameAudioSource(audio.src, currentSong.src)) return;
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
  }, [isPlaying, isDesktopClient, currentSong.src]);

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

    // Protect the preloading track so it survives LRU eviction while being
    // warmed up for playback.
    protectAsset(nextSong.src);

    let cancelled = false;

    (async () => {
      const cachedSrc = await getCachedAudioUrl(nextSong.src);
      if (cancelled) return;

      if (!preloadRef.current) {
        preloadRef.current = new Audio();
        preloadRef.current.preload = 'auto';
      }

      // Match the main audio element's CORS mode so the preload behaves the
      // same way on development/preview domains with a fixed CDN Origin.
      const corsSupported = await isCorsSupported(nextSong.src);
      if (cancelled) return;
      preloadRef.current.crossOrigin = corsSupported ? 'anonymous' : null;

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
      unprotectAsset(nextSong.src);
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
        triedAudioUrlsRef.current.clear();
        setAudioUrlOverride(null);
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
    setAudioUrlOverride(null);
    setIsPlaying(true);
    // Read position synchronously from the ref so state setters stay outside
    // the updater (React StrictMode invokes updaters twice).
    const currentPos = currentPositionRef.current;
    const computedNext = currentPos + 1;
    if (computedNext >= shuffledOrderRef.current.length) {
      const currentIdx = shuffledOrderRef.current[currentPos];
      const newOrder = shuffleArray(playlist.length);
      // Ensure the next loop starts with a different track when possible,
      // otherwise the current index would not change and the audio effect
      // would not reload, leaving playback paused.
      if (playlist.length > 1 && newOrder[0] === currentIdx) {
        const swapIndex = Math.floor(Math.random() * (newOrder.length - 1)) + 1;
        [newOrder[0], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[0]];
      }
      setShuffledOrder(newOrder);
      setCurrentPosition(0);
    } else {
      setCurrentPosition(computedNext);
    }
  }, [playlist.length, playMode]);

  const prev = useCallback(() => {
    if (playlist.length === 0) return;
    setHasUserInteracted(true);
    setSystemPaused(false);
    resumeAudioContext(audioRef.current);
    const prevPos = currentPositionRef.current;
    if (prevPos <= 0) {
      // In sequential mode, stay on the first track instead of wrapping to
      // the end. Restart it from the beginning and keep playback intent.
      if (playMode === 'sequential') {
        if (audioRef.current) audioRef.current.currentTime = 0;
        setCurrentTime(0);
        intendedPlayingRef.current = true;
        setIsPlaying(true);
        return;
      }
      trackChangeRef.current = true;
      setAudioUrlOverride(null);
      intendedPlayingRef.current = true;
      setIsPlaying(true);
      setCurrentPosition(shuffledOrderRef.current.length - 1);
      return;
    }
    trackChangeRef.current = true;
    setAudioUrlOverride(null);
    intendedPlayingRef.current = true;
    setIsPlaying(true);
    setCurrentPosition(prevPos - 1);
  }, [playlist.length, playMode]);

  const playSong = useCallback(
    (id: string) => {
      const targetIndex = playlist.findIndex((s) => s.id === id);
      if (targetIndex === -1) return;
      intendedPlayingRef.current = true;
      resumeAudioContext(audioRef.current);
      setIsPlaying(true);
      setIsOpen(true);
      setHasUserInteracted(true);

      const targetPosition = shuffledOrder.findIndex((idx) => idx === targetIndex);
      if (targetPosition === currentPositionRef.current) {
        // Selecting the already-current song does not rerun the load effect,
        // so the transition lock must NOT be left set or playback would never
        // be requested. Replay it directly when the src is already attached.
        const audio = audioRef.current;
        if (audio?.src && isSameAudioSource(audio.src, currentSong.src)) {
          trackChangeRef.current = false;
          audio.currentTime = 0;
          setCurrentTime(0);
          const promise = audio.play();
          if (promise !== undefined) {
            promise.catch((err: unknown) => {
              if ((err as Error | undefined)?.name === 'AbortError') return;
              intendedPlayingRef.current = false;
              setIsPlaying(false);
            });
          }
        } else {
          // No usable src yet: force the loader to attach it and start playback.
          trackChangeRef.current = true;
          setAudioEpoch((e) => e + 1);
        }
        return;
      }

      trackChangeRef.current = true;
      setAudioUrlOverride(null);
      if (targetPosition !== -1) {
        setCurrentPosition(targetPosition);
      } else {
        // Re-shuffle so the requested song is next.
        const newOrder = shuffleArray(playlist.length);
        const pos = newOrder.findIndex((idx) => idx === targetIndex);
        setShuffledOrder(newOrder);
        setCurrentPosition(pos >= 0 ? pos : 0);
      }
    },
    [playlist, shuffledOrder, currentSong.src]
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
      currentAudioSource,
      togglePlay,
      next,
      prev,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      // Dragging the volume slider while muted should restore audible sound;
      // otherwise the slider appears frozen at zero (bug fix).
      setVolume: (v: number) => {
        setVolumeState(v);
        if (v > 0 && isMuted) setIsMuted(false);
      },
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
      currentAudioSource,
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
