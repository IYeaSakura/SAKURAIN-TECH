'use client';

/**
 * WidgetFrame — desktop-style window chrome for homepage bento cards.
 *
 * Wraps each widget with a title bar, drag handle and window controls
 * (pin top, collapse) so the homepage feels like a modular dashboard.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pin, PinOff, Minus, Plus, GripVertical } from 'lucide-react';
import { useAnimationEnabled } from '@/hooks';

interface WidgetFrameProps {
  id: string;
  title: string;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
  isPinned?: boolean;
  isCollapsed?: boolean;
  onTogglePin?: (id: string) => void;
  onToggleCollapse?: (id: string) => void;
  onDrop?: (targetId: string) => void;
}

export function WidgetFrame({
  id,
  title,
  icon: Icon,
  children,
  isPinned = false,
  isCollapsed = false,
  onTogglePin,
  onToggleCollapse,
  onDrop,
}: WidgetFrameProps) {
  const [dragging, setDragging] = useState(false);
  const animationEnabled = useAnimationEnabled();

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    setDragging(true);
  };

  const handleDragEnd = () => {
    setDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId && sourceId !== id) {
      onDrop?.(id);
    }
  };

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group relative h-full"
    >
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="relative h-full flex flex-col border-2"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-subtle)',
          boxShadow: isPinned ? '6px 6px 0 var(--accent-primary)' : '4px 4px 0 var(--border-subtle)',
          cursor: 'move',
          opacity: dragging ? 0.5 : 1,
        }}
      >
        {/* Title bar */}
        <div
          className="flex items-center gap-2 px-3 py-2 border-b-2 select-none"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-tertiary)' }}
        >
          <GripVertical className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
          {Icon && <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-primary)' }} />}
          <span
            className="flex-1 text-[10px] font-mono uppercase tracking-wider truncate"
            style={{ color: 'var(--text-muted)' }}
          >
            {title}
          </span>
          <div className="flex items-center gap-1">
            {onToggleCollapse && (
              <button
                onClick={() => onToggleCollapse(id)}
                className="w-5 h-5 flex items-center justify-center border transition-colors hover:bg-[var(--bg-primary)]"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                title={isCollapsed ? 'Expand' : 'Collapse'}
                type="button"
              >
                {isCollapsed ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              </button>
            )}
            {onTogglePin && (
              <button
                onClick={() => onTogglePin(id)}
                className="w-5 h-5 flex items-center justify-center border transition-colors hover:bg-[var(--bg-primary)]"
                style={{
                  borderColor: 'var(--border-subtle)',
                  color: isPinned ? 'var(--accent-primary)' : 'var(--text-muted)',
                }}
                title={isPinned ? 'Unpin' : 'Pin'}
                type="button"
              >
                {isPinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div
          className="flex-1 overflow-hidden transition-all"
          style={{
            maxHeight: isCollapsed ? 0 : undefined,
            padding: isCollapsed ? 0 : undefined,
            opacity: isCollapsed ? 0 : 1,
          }}
        >
          {children}
        </div>
      </div>
    </motion.div>
  );
}
