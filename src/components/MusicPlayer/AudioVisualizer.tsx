'use client';

/**
 * AudioVisualizer — compact frequency bars for the music player.
 *
 * Connects to the shared HTMLAudioElement via Web Audio API and renders
 * theme-aware rectangular bars. The connection is cached globally so the
 * visualizer can be mounted/unmounted without recreating the audio graph.
 */

import { useEffect, useRef, useCallback } from 'react';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
}

interface AudioConnection {
  context: AudioContext;
  analyser: AnalyserNode;
  source: MediaElementAudioSourceNode;
}

const globalAudioMap = new WeakMap<HTMLAudioElement, AudioConnection>();

export function AudioVisualizer({ audioRef, isPlaying }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isInitializedRef = useRef(false);
  const isActiveRef = useRef(false);
  const colorRef = useRef('var(--accent-primary)');

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

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gap = 1;
    const barCount = 40;
    const barWidth = (canvas.width - (barCount - 1) * gap) / barCount;
    const samplesPerBar = Math.max(1, Math.floor(bufferLength / barCount));

    ctx.fillStyle = colorRef.current;

    for (let i = 0; i < barCount; i++) {
      let sum = 0;
      for (let j = 0; j < samplesPerBar; j++) {
        sum += dataArray[i * samplesPerBar + j];
      }
      const average = sum / samplesPerBar;
      const barHeight = (average / 255) * canvas.height;
      const x = i * (barWidth + gap);
      const y = canvas.height - barHeight;
      ctx.fillRect(x, y, barWidth, barHeight);
    }

    animationRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isInitializedRef.current) return;

    const existing = globalAudioMap.get(audio);
    if (existing) {
      analyserRef.current = existing.analyser;
      isInitializedRef.current = true;
    } else {
      const AudioContextClass = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.82;

      try {
        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        analyserRef.current = analyser;
        isInitializedRef.current = true;
        globalAudioMap.set(audio, { context: audioContext, analyser, source });
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[AudioVisualizer] Audio context init failed:', err);
        }
      }
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
    };
  }, [audioRef]);

  useEffect(() => {
    if (!isInitializedRef.current) return;

    if (isPlaying) {
      const audio = audioRef.current;
      if (audio) {
        const connection = globalAudioMap.get(audio);
        if (connection?.context.state === 'suspended') {
          connection.context.resume();
        }
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
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, draw, audioRef]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={40}
      className="w-full h-10 opacity-90"
      style={{ imageRendering: 'crisp-edges' }}
    />
  );
}
