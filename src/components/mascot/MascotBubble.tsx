'use client';

/**
 * MascotBubble — comic-style speech bubble for SAKU-CHAN.
 *
 * Renders above the mascot and auto-dismisses after a short delay.
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MascotBubbleProps {
  text: string;
  visible: boolean;
  onDismiss: () => void;
}

const DISMISS_DELAY = 3600;

export function MascotBubble({ text, visible, onDismiss }: MascotBubbleProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, DISMISS_DELAY);
    return () => clearTimeout(timer);
  }, [visible, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.96 }}
          transition={{ duration: 0.18 }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-3 border-2 pointer-events-none"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-subtle)',
            boxShadow: '3px 3px 0 var(--border-subtle)',
          }}
        >
          <p
            className="text-[11px] leading-relaxed font-sans"
            style={{ color: 'var(--text-primary)' }}
          >
            {text}
          </p>
          <span
            className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0"
            style={{
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid var(--border-subtle)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
