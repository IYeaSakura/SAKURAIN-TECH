'use client';

/**
 * MascotMoodOverlay — small mood icon floating next to SAKU-CHAN.
 *
 * Provides immediate visual feedback for the current emotional state without
 * requiring new sprite assets.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, HelpCircle, Zap, Moon, Smile } from 'lucide-react';
import type { Mood } from './types';

const ICONS: Record<Mood, React.ComponentType<{ className?: string }> | null> = {
  neutral: null,
  happy: Smile,
  curious: HelpCircle,
  sleepy: Moon,
  surprised: Zap,
  love: Heart,
};

interface MascotMoodOverlayProps {
  mood: Mood;
}

export function MascotMoodOverlay({ mood }: MascotMoodOverlayProps) {
  const Icon = ICONS[mood];
  if (!Icon) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={mood}
        initial={{ opacity: 0, scale: 0.5, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5, y: 4 }}
        transition={{ duration: 0.18 }}
        className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center border-2 rounded-full"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--accent-primary)',
        }}
      >
        <Icon className="w-3.5 h-3.5" />
      </motion.div>
    </AnimatePresence>
  );
}
