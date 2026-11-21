'use client';

/**
 * AudioMetrics — real-time audio statistics for the music page.
 *
 * Renders a compact spectrum plus truthful numeric read-outs. Spectrum data is
 * supplied by the shared useSpectrum hook; bars and numbers are updated
 * imperatively via refs so playback never triggers React re-renders.
 */
import { useEffect, useRef } from 'react';
import { useTranslation } from '@/hooks';
import { useSpectrum, type SpectrumFrame } from './shared/useSpectrum';

interface AudioMetricsProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  isLoading: boolean;
  systemPaused: boolean;
}

const BAR_COUNT = 96;

export function AudioMetrics({ audioRef, isPlaying, isLoading, systemPaused }: AudioMetricsProps) {
  const { t } = useTranslation();
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const peakRef = useRef<HTMLSpanElement>(null);
  const rateRef = useRef<HTMLSpanElement>(null);
  const chRef = useRef<HTMLSpanElement>(null);

  const handleFrame = ({ bars, peakDb, sampleRate, channels }: SpectrumFrame) => {
    // Imperative DOM updates — no setState, so the component never re-renders.
    for (let i = 0; i < barsRef.current.length; i++) {
      const el = barsRef.current[i];
      if (!el) continue;
      const value = bars[i] ?? 0;
      el.style.height = `${Math.max(2, (value / 255) * 24)}px`;
      el.style.background = value > 180 ? 'var(--accent-primary)' : 'var(--text-muted)';
    }
    if (peakRef.current) peakRef.current.textContent = `${peakDb} dB`;
    if (rateRef.current) rateRef.current.textContent = `${(sampleRate / 1000).toFixed(1)} kHz`;
    if (chRef.current) chRef.current.textContent = `${channels} ch`;
  };

  // Throttle to ~12.5 fps: plenty for DOM bars, far less work than per-frame.
  useSpectrum({ audioRef, isPlaying, barCount: BAR_COUNT, onFrame: handleFrame, throttleMs: 80 });

  // Clear bars when playback stops.
  useEffect(() => {
    if (isPlaying) return;
    barsRef.current.forEach((el) => {
      if (el) el.style.height = '2px';
    });
  }, [isPlaying]);

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
        <span ref={peakRef} style={{ color: 'var(--accent-primary)' }}>-96 dB</span>
      </div>

      {/* Spectrum bars */}
      <div className="flex items-end gap-[1px] h-6 flex-1 min-w-0">
        {Array.from({ length: BAR_COUNT }, (_, index) => (
          <div
            key={index}
            ref={(el) => { barsRef.current[index] = el; }}
            className="flex-1 min-w-[1px]"
            style={{ height: '2px', background: 'var(--text-muted)' }}
          />
        ))}
      </div>

      {/* Truthful numeric read-outs — no hardcoded bitrate/channels (⑤). */}
      <div
        className="hidden lg:flex flex-col justify-center text-[9px] font-mono leading-tight"
        style={{ color: 'var(--text-muted)' }}
      >
        <span ref={rateRef}>-- kHz</span>
        <span ref={chRef}>-- ch</span>
      </div>
    </div>
  );
}
