'use client';

/**
 * AudioVisualizer — real-time frequency spectrum for the mini player.
 *
 * Renders theme-aware rectangular bars on a canvas over a logarithmic
 * frequency scale. Connection setup, smoothing and bin mapping live in the
 * shared audio-analyser module + useSpectrum hook.
 */
import { useEffect, useRef } from 'react';
import { useSpectrum } from './shared/useSpectrum';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  barCount?: number;
  width?: number;
  height?: number;
}

export function AudioVisualizer({
  audioRef,
  isPlaying,
  barCount = 64,
  width = 240,
  height = 40,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorRef = useRef('#0E639C');
  const gap = 1;

  // Track the theme accent so bars repaint in the right colour.
  useEffect(() => {
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
    return () => observer.disconnect();
  }, []);

  const handleFrame = ({ bars }: { bars: number[] }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale the backing store for high-DPI screens so bars stay crisp (⑧).
    const dpr = window.devicePixelRatio || 1;
    const bw = Math.round(width * dpr);
    const bh = Math.round(height * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = colorRef.current;

    const drawWidth = width - (barCount - 1) * gap;
    const barWidth = Math.max(1, drawWidth / barCount);
    for (let i = 0; i < bars.length; i++) {
      const barHeight = (bars[i] / 255) * height;
      ctx.fillRect(i * (barWidth + gap), height - barHeight, barWidth, barHeight);
    }
  };

  useSpectrum({ audioRef, isPlaying, barCount, onFrame: handleFrame });

  // Clear the canvas when playback stops (the rAF loop stops updating on silence).
  useEffect(() => {
    if (isPlaying) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [isPlaying]);

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
