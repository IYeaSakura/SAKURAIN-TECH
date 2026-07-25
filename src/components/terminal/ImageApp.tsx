/**
 * Full-screen image viewer for the terminal.
 *
 * Displays an image as a pixel-art canvas by drawing it at a low logical
 * resolution and scaling it up with CSS pixelation.
 */

'use client';

import { useEffect, useRef, useState } from 'react';

interface ImageAppProps {
  src: string;
  onExit: () => void;
}

export function ImageApp({ src, onExit }: ImageAppProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Escape') {
        e.preventDefault();
        onExit();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onExit]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setStatus('loading');
    const img = new Image();
    // Avoid forcing CORS for local/same-origin assets; drawImage works for
    // display even if the canvas becomes tainted.
    const timeout = window.setTimeout(() => setStatus('error'), 10000);

    img.onload = () => {
      window.clearTimeout(timeout);
      const aspect = img.naturalWidth / img.naturalHeight;
      // Target a small logical width so the image looks like pixel art.
      const targetWidth = 120;
      const w = Math.max(16, Math.min(img.naturalWidth, targetWidth));
      const h = Math.max(16, Math.round(w / aspect));

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, w, h);
      }
      setStatus('ready');
    };
    img.onerror = () => {
      window.clearTimeout(timeout);
      setStatus('error');
    };
    img.src = src;

    return () => window.clearTimeout(timeout);
  }, [src]);

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col p-4 font-mono text-sm"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
      onClick={onExit}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="font-bold" style={{ color: 'var(--accent-primary)' }}>
          Image Viewer
        </span>
        <span style={{ color: 'var(--text-muted)' }}>q / Esc / click to close</span>
      </div>

      <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
        {status === 'loading' && (
          <span style={{ color: 'var(--text-muted)' }}>Loading image...</span>
        )}
        {status === 'error' && (
          <span style={{ color: 'var(--error)' }}>Failed to load image: {src}</span>
        )}
        {status === 'ready' && (
          <canvas
            ref={canvasRef}
            className="w-full h-full max-w-[90vw] max-h-[80vh] object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        )}
      </div>

      <div className="mt-4 truncate" style={{ color: 'var(--text-muted)' }}>
        {src}
      </div>
    </div>
  );
}
