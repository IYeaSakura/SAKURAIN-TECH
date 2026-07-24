'use client';

/**
 * AudioMetrics — real-time audio statistics for the music page.
 *
 * Connects to the shared HTMLAudioElement via Web Audio API and renders a
 * compact spectrum bar graph together with numeric read-outs for sample rate,
 * bitrate and playback state.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { globalAudioMap } from './AudioVisualizer';

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

const DEFAULT_BARS = Array.from({ length: 16 }, () => 0);

export function AudioMetrics({ audioRef, isPlaying, isLoading, systemPaused }: AudioMetricsProps) {
  const animationRef = useRef<number>(0);
  const isInitializedRef = useRef(false);
  const lastFrameRef = useRef(0);
  const [metrics, setMetrics] = useState<Metrics>({
    bars: DEFAULT_BARS,
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
      analyser.fftSize = 128;
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

    let bars = DEFAULT_BARS;
    let peakDb = -96;

    if (analyser) {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const barCount = 16;
      const samplesPerBar = Math.max(1, Math.floor(bufferLength / barCount));
      bars = Array.from({ length: barCount }, (_, i) => {
        let sum = 0;
        for (let j = 0; j < samplesPerBar; j++) {
          sum += dataArray[i * samplesPerBar + j] ?? 0;
        }
        return sum / samplesPerBar;
      });

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
    ? 'SYSTEM PAUSED'
    : isLoading
      ? 'BUFFERING'
      : isPlaying
        ? 'PLAYING'
        : 'PAUSED';

  return (
    <div className="flex items-center gap-3 h-10">
      {/* State badge */}
      <div
        className="hidden md:flex flex-col justify-center h-full px-2 text-[9px] font-bold uppercase tracking-wider border"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
      >
        <span>{stateLabel}</span>
        <span style={{ color: 'var(--accent-primary)' }}>{metrics.peakDb} dB</span>
      </div>

      {/* Spectrum bars */}
      <div className="flex items-end gap-0.5 h-6">
        {metrics.bars.map((value, index) => {
          const height = Math.max(2, (value / 255) * 24);
          return (
            <div
              key={index}
              className="w-1"
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
