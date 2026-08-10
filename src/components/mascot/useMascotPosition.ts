'use client';

/**
 * useMascotPosition — manages the mascot's fixed viewport position.
 *
 * Stores absolute top-left coordinates in localStorage so the pet reappears
 * in the same spot after navigation or refresh. A new storage key avoids
 * conflicts with the old offset-based format from Phase 1.
 */

import { useState, useEffect, useCallback } from 'react';
import { useMotionValue } from 'framer-motion';

const STORAGE_KEY = 'sakurain-mascot-position-v2';
export const MASCOT_SIZE = 64;
const MARGIN = 24;

export interface MascotPosition {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getDefaultPosition(width: number, height: number): MascotPosition {
  return {
    x: width - MASCOT_SIZE - MARGIN,
    y: height - MASCOT_SIZE - MARGIN,
  };
}

function loadPosition(): MascotPosition | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MascotPosition) : null;
  } catch {
    return null;
  }
}

export function savePosition(pos: MascotPosition) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  } catch {
    // Ignore storage access errors (e.g. private browsing).
  }
}

export function useMascotPosition() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [ready, setReady] = useState(false);

  const clampPosition = useCallback(
    (pos: MascotPosition): MascotPosition => ({
      x: clamp(pos.x, MARGIN, windowSize.width - MASCOT_SIZE - MARGIN),
      y: clamp(pos.y, MARGIN, windowSize.height - MASCOT_SIZE - MARGIN),
    }),
    [windowSize]
  );

  // Track viewport size for boundary clamping.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Restore the persisted position once the viewport size is known.
  useEffect(() => {
    if (windowSize.width === 0 || ready) return;

    const saved = loadPosition();
    const initial = clampPosition(
      saved ?? getDefaultPosition(windowSize.width, windowSize.height)
    );
    x.set(initial.x);
    y.set(initial.y);
    setReady(true);
  }, [windowSize, ready, x, y, clampPosition]);

  // Keep the pet inside the viewport after resizes.
  useEffect(() => {
    if (!ready || windowSize.width === 0) return;

    const current = { x: x.get(), y: y.get() };
    const safe = clampPosition(current);
    if (safe.x !== current.x || safe.y !== current.y) {
      x.set(safe.x);
      y.set(safe.y);
      savePosition(safe);
    }
  }, [windowSize, ready, x, y, clampPosition]);

  const persist = useCallback(() => {
    savePosition(clampPosition({ x: x.get(), y: y.get() }));
  }, [x, y, clampPosition]);

  const reset = useCallback(() => {
    if (windowSize.width === 0) return;
    const pos = getDefaultPosition(windowSize.width, windowSize.height);
    x.set(pos.x);
    y.set(pos.y);
    savePosition(pos);
  }, [windowSize, x, y]);

  return { x, y, ready, persist, reset, windowSize };
}
