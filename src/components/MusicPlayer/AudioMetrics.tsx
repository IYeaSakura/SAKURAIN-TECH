'use client';

/**
 * AudioMetrics — real-time audio statistics for the music page.
 *
 * Connects to the shared HTMLAudioElement via Web Audio API and renders a
 * compact spectrum bar graph using a logarithmic 30 Hz ~ 16 kHz frequency
 * range, together with numeric read-outs for sample rate, bitrate and
 * playback state.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { globalAudioMap } from './AudioVisualizer';
import { useTranslation } from '@/hooks';

interface AudioMetricsProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  isLoading: boolean;
  systemPaused: boolean;
}

interface Metrics {
  bars: number[];
  peakDb: number;
  sampleRate: number;
  channels: number;
  bitrate: number;
}

const MIN_FREQ = 30;
const MAX_FREQ = 16000;
const FFT_SIZE = 8192;
const BAR_COUNT = 96;
const SMOOTHING = 0.75;
/** Curve power > 1 expands the low-frequency (left) bands visually. */
const FREQ_CURVE_POWER = 1.5;

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

export function AudioMetrics({ audioRef, isPlaying, isLoading, systemPaused }: AudioMetricsProps) {
  const { t } = useTranslation();
  const animationRef = useRef<number>(0);
  const isInitializedRef = useRef(false);
  const lastFrameRef = useRef(0);
  const smoothedBarsRef = useRef<number[]>(Array.from({ length: BAR_COUNT }, () => 0));
  const [metrics, setMetrics] = useState<Metrics>({
    bars: smoothedBarsRef.current,
    peakDb: -96,
    sampleRate: 44100,
    channels: 2,
    bitrate: 320,
  });

  // Ensure a Web Audio analyser is attached to the shared audio element.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isInitializedRef.current) return;

    const existing = globalAudioMap.get(audio);
    if (existing) {
      isInitializedRef.current = true;
      return;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.82;

      const source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      globalAudioMap.set(audio, { context: audioContext, analyser, source });
      isInitializedRef.current = true;
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[AudioMetrics] Audio context init failed:', err);
      }
    }
  }, [audioRef]);

  const readMetrics = useCallback(() => {
    const audio = audioRef.current;
    const connection = audio ? globalAudioMap.get(audio) : undefined;
    const analyser = connection?.analyser;

    let bars = smoothedBarsRef.current;
    let peakDb = -96;

    if (analyser) {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const rawBars = getLogBars(dataArray, analyser.context.sampleRate, analyser.fftSize, BAR_COUNT);
      smoothedBarsRef.current = rawBars.map((value, i) => {
        const prev = smoothedBarsRef.current[i] ?? 0;
        return prev * SMOOTHING + value * (1 - SMOOTHING);
      });
      bars = smoothedBarsRef.current;

      const peak = Math.max(...dataArray, 1);
      peakDb = Math.round(20 * Math.log10(peak / 255));
    }

    setMetrics((prev) => ({
      bars,
      peakDb,
      sampleRate: connection?.context.sampleRate || prev.sampleRate,
      channels: 2,
      bitrate: prev.bitrate,
    }));
  }, [audioRef]);

  useEffect(() => {
    const audio = audioRef.current;
    const connection = audio ? globalAudioMap.get(audio) : undefined;

    const tick = () => {
      if (connection?.context.state === 'suspended') {
        connection.context.resume().catch(() => {});
      }
      const now = performance.now();
      if (now - lastFrameRef.current >= 80) {
        lastFrameRef.current = now;
        readMetrics();
      }
      animationRef.current = requestAnimationFrame(tick);
    };

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(tick);
    } else {
      readMetrics();
    }

    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, readMetrics, audioRef]);

  const stateLabel = systemPaused
    ? t.music.audioMetrics.systemPaused
    : isLoading
      ? t.music.audioMetrics.buffering
      : isPlaying
        ? t.music.audioMetrics.playing
        : t.music.audioMetrics.paused;

  return (
    <div className="flex items-center gap-3 h-10 w-72">
      {/* State badge */}
      <div
        className="hidden md:flex flex-col justify-center h-full px-2 text-[9px] font-bold uppercase tracking-wider border"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
      >
        <span>{stateLabel}</span>
        <span style={{ color: 'var(--accent-primary)' }}>{metrics.peakDb} dB</span>
      </div>

      {/* Spectrum bars */}
      <div className="flex items-end gap-[1px] h-6 flex-1 min-w-0">
        {metrics.bars.map((value, index) => {
          const height = Math.max(2, (value / 255) * 24);
          return (
            <div
              key={index}
              className="flex-1 min-w-[1px]"
              style={{
                height: `${height}px`,
                background: value > 180 ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
            />
          );
        })}
      </div>

      {/* Numeric read-outs */}
      <div
        className="hidden lg:flex flex-col justify-center text-[9px] font-mono leading-tight"
        style={{ color: 'var(--text-muted)' }}
      >
        <span>{(metrics.sampleRate / 1000).toFixed(1)} kHz</span>
        <span>{metrics.bitrate} kbps</span>
      </div>
    </div>
  );
}
