'use client';

/**
 * RecentShuoshuo —— brutalist recent notes card for the homepage.
 *
 * Matches the other homepage widgets: thick borders, pixel shadows,
 * monospace labels and no glass effects.
 */

import { motion } from 'framer-motion';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { useAnimationEnabled, useNavigation } from '@/hooks';
import type { Note } from '@/lib/content/notes';

interface RecentShuoshuoProps {
  /** 全部随记（构建期注入） */
  notes: Note[];
  /** 最多展示条数 */
  maxItems?: number;
}

export function RecentShuoshuo({ notes, maxItems = 5 }: RecentShuoshuoProps) {
  const animationEnabled = useAnimationEnabled();
  const { navigateTo } = useNavigation();
  const recentNotes = notes.slice(0, maxItems);

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex flex-col border-2 p-5"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-subtle)',
        boxShadow: '4px 4px 0 var(--border-subtle)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
          <span
            className="text-xs font-mono uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Shuoshuo
          </span>
        </div>
        <button
          onClick={() => navigateTo('/shuoshuo')}
          className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider transition-opacity hover:opacity-70"
          style={{ color: 'var(--accent-primary)' }}
        >
          All
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {recentNotes.length === 0 ? (
          <div
            className="flex-1 flex items-center justify-center text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            No shuoshuo yet
          </div>
        ) : (
          recentNotes.map((note, index) => (
            <motion.div
              key={note.id}
              initial={animationEnabled ? { opacity: 0, x: -8 } : undefined}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
              onClick={() => navigateTo('/shuoshuo')}
              className="group cursor-pointer p-2.5 border-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-bold truncate group-hover:underline"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {note.title}
                  </p>
                  <p
                    className="text-xs line-clamp-1 mt-0.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {note.content.replace(/\n/g, ' ')}
                  </p>
                </div>
              </div>
              <div
                className="flex items-center gap-2 mt-1.5 text-[10px] font-mono"
                style={{ color: 'var(--text-muted)' }}
              >
                <span>{note.fullDate}</span>
                <span>·</span>
                <span>{note.fullTime}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
