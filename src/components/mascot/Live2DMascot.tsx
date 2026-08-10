'use client';

/**
 * Live2DMascot — proof-of-concept Live2D desktop pet using pixi-live2d-display.
 *
 * Loads the Cubism 4 Core runtime and renders Live2D's free "Haru" sample model
 * in the bottom-right corner. This is a temporary stand-in until a custom
 * SAKU-CHAN Live2D model is ready.
 */

import { useEffect, useRef, useState } from 'react';

const CUBISM_CORE_URL = '/live2d/live2dcubismcore.min.js';
const HARU_MODEL_URL = '/live2d/haru/haru_greeter_t03.model3.json';

const VIEW_WIDTH = 320;
const VIEW_HEIGHT = 400;

export function Live2DMascot() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [coreReady, setCoreReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only run on the client.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load the Cubism Core runtime once.
  useEffect(() => {
    if (!mounted || typeof document === 'undefined') return;

    const existing = document.querySelector(
      `script[src="${CUBISM_CORE_URL}"]`
    );
    if (existing) {
      if ((window as unknown as Record<string, unknown>).Live2DCubismCore) {
        setCoreReady(true);
      } else {
        existing.addEventListener('load', () => setCoreReady(true));
      }
      return;
    }

    const script = document.createElement('script');
    script.src = CUBISM_CORE_URL;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => setCoreReady(true);
    script.onerror = () => setError('Failed to load Cubism Core runtime');
    document.body.appendChild(script);
  }, [mounted]);

  // Initialize PixiJS + Live2D after the core runtime is ready.
  useEffect(() => {
    if (!coreReady || !containerRef.current) return;

    let app: InstanceType<typeof import('pixi.js').Application> | null = null;
    let model: Awaited<ReturnType<typeof import('pixi-live2d-display/cubism4').Live2DModel.from>> | null = null;
    let cancelled = false;

    const init = async () => {
      try {
        const PIXI = await import('pixi.js');
        const { Live2DModel } = await import('pixi-live2d-display/cubism4');

        if (cancelled) return;

        // Expose PIXI so the plugin can register its ticker.
        (window as unknown as Record<string, unknown>).PIXI = PIXI;
        Live2DModel.registerTicker(PIXI.Ticker);

        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';

        app = new PIXI.Application({
          view: canvas,
          width: VIEW_WIDTH,
          height: VIEW_HEIGHT,
          transparent: true,
          antialias: true,
          autoStart: true,
        });

        containerRef.current!.appendChild(canvas);

        model = await Live2DModel.from(HARU_MODEL_URL);

        if (cancelled) {
          model.destroy();
          app.destroy();
          return;
        }

        model.scale.set(0.18);
        model.anchor.set(0.5, 0.5);
        model.x = VIEW_WIDTH / 2;
        model.y = VIEW_HEIGHT * 0.65;
        model.interactive = true;

        // Play a motion when the body is tapped.
        model.on('hit', (hitAreas: string[]) => {
          if (hitAreas.includes('Body')) {
            model!.motion('tap_body');
          }
        });

        app.stage.addChild(model);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      if (model) {
        model.destroy();
      }
      if (app) {
        app.destroy(true, { children: true, texture: true, baseTexture: true });
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [coreReady]);

  if (!mounted) return null;

  return (
    <div
      className="fixed bottom-2 left-2 z-[95] pointer-events-auto"
      style={{ width: VIEW_WIDTH, height: VIEW_HEIGHT }}
      title="SAKU-CHAN (Live2D POC)"
    >
      {error && (
        <div className="text-xs text-error p-2">Live2D: {error}</div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
