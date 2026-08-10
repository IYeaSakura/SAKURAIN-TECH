'use client';

/**
 * MascotPet — a free-roaming desktop pet version of SAKU-CHAN.
 *
 * Phase 1 MVP:
 * - Sits in the bottom-right corner by default.
 * - Draggable to any screen position; position persists across pages.
 * - Click shows a comic speech bubble with context-aware lines.
 * - Gentle idle bobbing and walking tilt animation.
 * - Face subtly leans toward the mouse cursor.
 *
 * Future phases will add environment awareness, pathfinding, and
 * multi-frame sprite animations.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useTranslation, useAnimationEnabled, useIsMobile } from '@/hooks';
import { useMascotLines } from './useMascotLines';
import { MascotBubble } from './MascotBubble';

const STORAGE_KEY = 'sakurain-mascot-position';

interface MascotPosition {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function MascotPet() {
  const { locale } = useTranslation();
  const animationEnabled = useAnimationEnabled();
  const isMobile = useIsMobile();
  const lines = useMascotLines(locale);

  const [mounted, setMounted] = useState(false);
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 15 };
  const rotateXSpring = useSpring(rotateX, springConfig);
  const rotateYSpring = useSpring(rotateY, springConfig);

  // Subtle face tilt toward mouse.
  useEffect(() => {
    if (!mounted || isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      rotateY.set((clientX - centerX) / centerX * 8);
      rotateX.set(-(clientY - centerY) / centerY * 8);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mounted, isMobile, rotateX, rotateY]);

  // Restore persisted position on mount.
  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const pos: MascotPosition = JSON.parse(raw);
        x.set(pos.x);
        y.set(pos.y);
      }
    } catch {
      // Ignore storage errors.
    }
  }, [x, y]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    if (typeof window === 'undefined') return;

    const currentX = x.get();
    const currentY = y.get();
    const maxX = window.innerWidth - 64;
    const maxY = window.innerHeight - 64;

    const safeX = clamp(currentX, 0, maxX);
    const safeY = clamp(currentY, 0, maxY);

    x.set(safeX);
    y.set(safeY);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: safeX, y: safeY }));
    } catch {
      // Ignore storage errors.
    }
  }, [x, y]);

  const handleClick = useCallback(() => {
    if (isDragging) return;
    setBubbleText(lines.random());
  }, [isDragging, lines]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    setBubbleText(null);
  }, []);

  const dismissBubble = useCallback(() => {
    setBubbleText(null);
  }, []);

  if (!mounted || isMobile) return null;

  return (
    <motion.div
      ref={containerRef}
      drag
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{
        x,
        y,
        position: 'fixed',
        right: 24,
        bottom: 24,
        zIndex: 90,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      className="pointer-events-auto"
      title="SAKU-CHAN"
    >
      <MascotBubble text={bubbleText ?? ''} visible={!!bubbleText} onDismiss={dismissBubble} />

      <motion.button
        type="button"
        onClick={handleClick}
        animate={
          animationEnabled && !isDragging
            ? {
                y: [0, -4, 0],
                rotate: [-2, 2, -2],
              }
            : undefined
        }
        transition={
          animationEnabled
            ? {
                y: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
                rotate: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
              }
            : undefined
        }
        style={{
          rotateX: rotateXSpring,
          rotateY: rotateYSpring,
          transformPerspective: 200,
          imageRendering: 'pixelated',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: isDragging ? 'grabbing' : 'pointer',
        }}
        className="relative w-16 h-16 block"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <img
          src="/image/mascot/saku-chan.png"
          alt="SAKU-CHAN"
          className="w-full h-full object-contain drop-shadow-md"
          style={{ imageRendering: 'pixelated' }}
          draggable={false}
        />
      </motion.button>
    </motion.div>
  );
}
