'use client';

/**
 * AudioVisualizer — real-time frequency spectrum for the music player.
 *
 * Connects to the shared HTMLAudioElement via Web Audio API and renders
 * theme-aware rectangular bars using a logarithmic frequency scale focused
 * on the 30 Hz ~ 16 kHz audible range. The connection is cached globally so
 * the visualizer can be mounted/unmounted without recreating the audio graph.
 */

import { useEffect, useRef, useCallback } from 'react';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  barCount?: number;
  width?: number;
  height?: number;
}

interface AudioConnection {
  context: AudioContext;
  analyser: AnalyserNode;
  source: MediaElementAudioSourceNode;
}

export const globalAudioMap = new WeakMap<HTMLAudioElement, AudioConnection>();

/**
 * Create and cache a Web Audio analyser connection for an HTMLAudioElement.
 * Idempotent: returns the existing connection if one has already been created.
 * Returns undefined when the element is not in CORS-anonymous mode, because
 * attaching a MediaElementSource to a non-CORS element mutes audio output.
 */
export function initAudioConnection(audio: HTMLAudioElement): AudioConnection | undefined {
  const existing = globalAudioMap.get(audio);
  if (existing) return existing;

  if (audio.crossOrigin !== 'anonymous') return undefined;

  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return undefined;

  const audioContext = new AudioContextClass();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = DEFAULT_FFT_SIZE;
  analyser.smoothingTimeConstant = 0.82;

  try {
    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    const connection: AudioConnection = { context: audioContext, analyser, source };
    globalAudioMap.set(audio, connection);
    return connection;
  } catch {
    return undefined;
  }
}

/**
 * Resume the Web Audio context associated with an HTMLAudioElement.
 * Must be called synchronously inside a user gesture to satisfy browser
 * autoplay policies.
 */
export function resumeAudioContext(audio: HTMLAudioElement | null | undefined): void {
  if (!audio) return;
  const connection = globalAudioMap.get(audio);
  if (connection && connection.context.state === 'suspended') {
    connection.context.resume().catch(() => {
      // Ignore resume failures; playback will simply not use Web Audio.
    });
  }
}

/** Audible range used for visualization; 16 kHz+ carries little musical energy. */
const MIN_FREQ = 60;
const MAX_FREQ = 16000;
const DEFAULT_FFT_SIZE = 8192;
const SMOOTHING = 0.75;
/** Curve power > 1 expands the low-frequency (left) bands visually. */
const FREQ_CURVE_POWER = 1.3;

function getLogBars(
  dataArray: Uint8Array,
  sampleRate: number,
  fftSize: number,
  barCount: number
): number[] {
  const binCount = dataArray.length;
  const binSize = sampleRate / fftSize;
  const ratio = Math.log(MAX_FREQ / MIN_FREQ);
  const bars: number[] = [];

  for (let i = 0; i < barCount; i++) {
    const startT = Math.pow(i / barCount, FREQ_CURVE_POWER);
    const endT = Math.pow((i + 1) / barCount, FREQ_CURVE_POWER);
    const startFreq = MIN_FREQ * Math.exp(startT * ratio);
    const endFreq = MIN_FREQ * Math.exp(endT * ratio);
    const startBin = Math.max(0, Math.floor(startFreq / binSize));
    const endBin = Math.min(binCount, Math.max(startBin + 1, Math.floor(endFreq / binSize)));

    let sum = 0;
    for (let j = startBin; j < endBin; j++) {
      sum += dataArray[j];
    }
    bars.push(sum / (endBin - startBin));
  }

  return bars;
}

export function AudioVisualizer({
  audioRef,
  isPlaying,
  barCount = 64,
  width = 240,
  height = 40,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isInitializedRef = useRef(false);
  const isActiveRef = useRef(false);
  const colorRef = useRef('var(--accent-primary)');
  const smoothedBarsRef = useRef<number[]>(Array.from({ length: barCount }, () => 0));

  const draw = useCallback(() => {
    if (!isActiveRef.current) return;

    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    if (!dataArrayRef.current || dataArrayRef.current.length !== bufferLength) {
      dataArrayRef.current = new Uint8Array(bufferLength) as Uint8Array<ArrayBuffer>;
    }
    const dataArray = dataArrayRef.current;
    analyser.getByteFrequencyData(dataArray);

    const sampleRate = analyser.context.sampleRate;
    const fftSize = analyser.fftSize;
    const bars = getLogBars(dataArray, sampleRate, fftSize, barCount);

    // Temporal smoothing for fluid motion.
    smoothedBarsRef.current = bars.map((value, i) => {
      const prev = smoothedBarsRef.current[i] ?? 0;
      return prev * SMOOTHING + value * (1 - SMOOTHING);
    });

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gap = 1;
    const drawWidth = canvas.width - (barCount - 1) * gap;
    const barWidth = Math.max(1, drawWidth / barCount);
    const fillWidth = Math.max(1, barWidth - 0);

    ctx.fillStyle = colorRef.current;

    smoothedBarsRef.current.forEach((value, i) => {
      const barHeight = (value / 255) * canvas.height;
      const x = i * (barWidth + gap);
      const y = canvas.height - barHeight;
      ctx.fillRect(x, y, fillWidth, barHeight);
    });

    animationRef.current = requestAnimationFrame(draw);
  }, [barCount]);

  useEffect(() => {
    if (isInitializedRef.current) return;

    let attempts = 0;
    let intervalId: number | null = null;

    const tryInit = () => {
      const audio = audioRef.current;
      if (!audio) return;

      const existing = globalAudioMap.get(audio);
      if (existing) {
        analyserRef.current = existing.analyser;
        isInitializedRef.current = true;
        if (intervalId) clearInterval(intervalId);
        return;
      }

      // Avoid attaching a MediaElementSource to a non-CORS element, which
      // would force the browser to mute the audio output. Do not stop polling
      // here: the player may still be probing CORS and will connect later.
      if (audio.crossOrigin !== 'anonymous') {
        return;
      }

      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) {
        if (intervalId) clearInterval(intervalId);
        return;
      }

      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = DEFAULT_FFT_SIZE;
      analyser.smoothingTimeConstant = 0.82;

      try {
        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        analyserRef.current = analyser;
        isInitializedRef.current = true;
        globalAudioMap.set(audio, { context: audioContext, analyser, source });
        if (intervalId) clearInterval(intervalId);
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[AudioVisualizer] Audio context init failed:', err);
        }
      }
    };

    tryInit();
    if (!isInitializedRef.current) {
      intervalId = window.setInterval(() => {
        attempts += 1;
        tryInit();
        if (attempts >= 50 && intervalId) clearInterval(intervalId);
      }, 200);
    }

    isActiveRef.current = true;

    const updateColor = () => {
      const computed = getComputedStyle(document.documentElement);
      colorRef.current = computed.getPropertyValue('--accent-primary').trim() || '#0E639C';
    };
    updateColor();

    const observer = new MutationObserver(updateColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    return () => {
      isActiveRef.current = false;
      cancelAnimationFrame(animationRef.current);
      observer.disconnect();
      if (intervalId) clearInterval(intervalId);
    };
  }, [audioRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Try to establish the Web Audio connection lazily when playback starts,
    // in case the mount-time init ran before the player had finished CORS
    // probing.
    if (!isInitializedRef.current && audio.crossOrigin === 'anonymous') {
      const connection = initAudioConnection(audio);
      if (connection) {
        analyserRef.current = connection.analyser;
        isInitializedRef.current = true;
      }
    }

    if (isPlaying) {
      const connection = globalAudioMap.get(audio);
      if (connection?.context.state === 'suspended') {
        connection.context.resume();
      }
      isActiveRef.current = true;
      draw();
    } else {
      isActiveRef.current = false;
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      smoothedBarsRef.current = Array.from({ length: barCount }, () => 0);
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, draw, audioRef, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="opacity-90"
      style={{ width: `${width}px`, height: `${height}px`, imageRendering: 'crisp-edges' }}
    />
  );
}
