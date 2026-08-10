'use client';

/**
 * MascotMenu — right-click context menu for SAKU-CHAN.
 *
 * Renders near the mascot and auto-dismisses when clicking elsewhere.
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface MascotMenuItem {
  id: string;
  label: string;
  onClick: () => void;
}

interface MascotMenuProps {
  open: boolean;
  x: number;
  y: number;
  items: MascotMenuItem[];
  onClose: () => void;
}

export function MascotMenu({ open, x, y, items, onClose }: MascotMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.96, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 4 }}
          transition={{ duration: 0.12 }}
          className="fixed z-[110] min-w-[140px] border-2 py-1"
          style={{
            left: x,
            top: y,
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-subtle)',
            boxShadow: '3px 3px 0 var(--border-subtle)',
          }}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                item.onClick();
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 text-[11px] font-sans transition-colors hover:bg-[var(--accent-primary)] hover:text-[var(--bg-primary)]"
              style={{ color: 'var(--text-primary)' }}
            >
              {item.label}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
