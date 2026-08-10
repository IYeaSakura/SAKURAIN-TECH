'use client';

/**
 * useMascotRoaming — autonomous movement loop for SAKU-CHAN.
 *
 * When enabled and the pet is idle, it periodically picks a safe target point
 * and walks there. The loop pauses while dragging, sleeping, or interacting
 * with the menu.
 */

import { useRef, useEffect, useCallback } from 'react';
import { animate, type MotionValue } from 'framer-motion';
import { pickRoamTarget, type RoamTarget } from './mascotEnvironment';

export type MascotMode = 'idle' | 'roaming' | 'dragging' | 'sleeping';

interface UseMascotRoamingOptions {
  enabled: boolean;
  mode: MascotMode;
  x: MotionValue<number>;
  y: MotionValue<number>;
  windowWidth: number;
  windowHeight: number;
  onMoveStart?: (target: RoamTarget) => void;
  onMoveEnd?: () => void;
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function useMascotRoaming({
  enabled,
  mode,
  x,
  y,
  windowWidth,
  windowHeight,
  onMoveStart,
  onMoveEnd,
}: UseMascotRoamingOptions) {
  const enabledRef = useRef(enabled);
  const modeRef = useRef(mode);
  const controlsRef = useRef<{ x: ReturnType<typeof animate>; y: ReturnType<typeof animate> } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const stop = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.x.stop();
      controlsRef.current.y.stop();
      controlsRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const scheduleNext = useCallback(
    (delay: number) => {
      timeoutRef.current = setTimeout(() => {
        if (modeRef.current !== 'idle' || !enabledRef.current) return;

        const target = pickRoamTarget(x.get(), y.get(), windowWidth, windowHeight);
        onMoveStart?.(target);

        const distance = Math.hypot(target.x - x.get(), target.y - y.get());
        const speed = 130; // pixels per second
        const duration = Math.max(0.6, Math.min(2.8, distance / speed));

        controlsRef.current = {
          x: animate(x, target.x, { duration, ease: 'linear' }),
          y: animate(y, target.y, { duration, ease: 'linear' }),
        };

        Promise.all([controlsRef.current.x, controlsRef.current.y]).then(() => {
          controlsRef.current = null;
          onMoveEnd?.();
        });
      }, delay);
    },
    [x, y, windowWidth, windowHeight, onMoveStart, onMoveEnd]
  );

  useEffect(() => {
    if (!enabled || mode !== 'idle') {
      stop();
      return;
    }

    scheduleNext(randomBetween(1200, 3500));

    return () => stop();
  }, [enabled, mode, scheduleNext, stop]);

  return { stop };
}
