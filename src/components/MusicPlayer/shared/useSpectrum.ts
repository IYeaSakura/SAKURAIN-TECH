'use client';

/**
 * Shared spectrum data hook.
 *
 * Owns the analyser subscription (survives connection disposal/recreation),
 * the requestAnimationFrame loop and audible-range bin mapping. It never calls
 * setState per frame — consumers receive data through `onFrame` and render it
 * (canvas or imperative DOM), so neither visualisation surface forces React
 * re-renders on every frame.
 */
import { useEffect, useRef } from 'react';
import {
  getAudioConnection,
  getLogBars,
  computePeakDb,
  subscribeAudioConnection,
  type AudioConnection,
} from './audio-analyser';

export interface SpectrumFrame {
  bars: number[];
  peakDb: number;
  sampleRate: number;
  channels: number;
}

interface UseSpectrumOptions {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  barCount: number;
  onFrame: (frame: SpectrumFrame) => void;
  /** Minimum ms between onFrame calls. 0 = every animation frame. */
  throttleMs?: number;
}

export function useSpectrum({
  audioRef,
  isPlaying,
  barCount,
  onFrame,
  throttleMs = 0,
}: UseSpectrumOptions): void {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const connectionRef = useRef<AudioConnection | undefined>(undefined);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const rafRef = useRef(0);
  const lastFrameRef = useRef(0);
  const onFrameRef = useRef(onFrame);
  const throttleRef = useRef(throttleMs);
  onFrameRef.current = onFrame;
  throttleRef.current = throttleMs;

  // Keep the analyser reference in sync whenever the connection is created or
  // disposed. This is what lets the visualizer recover after a CORS downgrade
  // or network reset rebuilds the audio element and its analyser (fixes ⑩).
  useEffect(() => {
    const sync = () => {
      const connection = getAudioConnection(audioRef.current);
      connectionRef.current = connection;
      analyserRef.current = connection?.analyser ?? null;
      dataArrayRef.current = null;
    };
    sync();
    return subscribeAudioConnection(sync);
  }, [audioRef]);

  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      return;
    }

    const draw = (now: number) => {
      const analyser = analyserRef.current;
      const connection = connectionRef.current;
      if (analyser && connection) {
        const bufferLength = analyser.frequencyBinCount;
        if (!dataArrayRef.current || dataArrayRef.current.length !== bufferLength) {
          dataArrayRef.current = new Uint8Array(bufferLength) as Uint8Array<ArrayBuffer>;
        }
        const dataArray = dataArrayRef.current;
        analyser.getByteFrequencyData(dataArray);

        // No second smoothing pass: analyser.smoothingTimeConstant already
        // smooths in the frequency domain, so a JS filter only added lag (⑨).
        const bars = getLogBars(dataArray, analyser.context.sampleRate, analyser.fftSize, barCount);

        const elapsed = now - lastFrameRef.current;
        if (throttleRef.current === 0 || elapsed >= throttleRef.current) {
          lastFrameRef.current = now;
          onFrameRef.current({
            bars,
            peakDb: computePeakDb(dataArray),
            sampleRate: analyser.context.sampleRate,
            channels: connection.source.channelCount,
          });
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [isPlaying, barCount, audioRef]);
}
