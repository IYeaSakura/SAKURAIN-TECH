'use client';

/**
 * PixelMascot — AI-generated pixel-art catgirl avatar for the Dynamic Island.
 *
 * Displays a compact, transparent-background mascot with a gentle floating
 * animation. Clicking the mascot triggers a configurable action (defaults to
 * opening the global search).
 */

import { motion } from 'framer-motion';
import { useAnimationEnabled } from '@/hooks';

interface PixelMascotProps {
  onClick?: () => void;
  title?: string;
}

export function PixelMascot({ onClick, title }: PixelMascotProps) {
  const animationEnabled = useAnimationEnabled();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      animate={
        animationEnabled
          ? {
              y: [0, -3, 0],
            }
          : undefined
      }
      transition={
        animationEnabled
          ? {
              y: {
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              },
              scale: { duration: 0.12 },
            }
          : undefined
      }
      className="relative w-12 h-12 overflow-hidden border-2 shrink-0 cursor-pointer"
      style={{
        borderColor: 'var(--border-subtle)',
        background: 'var(--bg-secondary)',
        imageRendering: 'pixelated',
      }}
      title={title}
    >
      <img
        src="/image/mascot/saku-chan.png"
        alt="Saku-chan"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] object-contain"
        style={{ imageRendering: 'pixelated' }}
      />
    </motion.button>
  );
}
