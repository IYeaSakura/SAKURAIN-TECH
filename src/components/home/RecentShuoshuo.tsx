'use client';

/**
 * RecentShuoshuo —— Apple 风格近期说说卡片。
 *
 * 以玻璃质感卡片展示最近随记，保留终端风格的时间戳与编号。
 */

import { motion } from 'framer-motion';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { useAnimationEnabled, useNavigation } from '@/hooks';
import type { Note } from '@/lib/content/notes';

interface RecentShuoshuoProps {
  notes: Note[];
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
      className="apple-bento h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-accent-secondary" />
          <span className="apple-mono-label">SHUOSHUO</span>
        </div>
        <button
          onClick={() => navigateTo('/shuoshuo')}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-accent-primary transition-colors font-mono"
        >
          ALL
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-2">
        {recentNotes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
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
              className="group cursor-pointer p-3 rounded-xl hover:bg-muted/10 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-accent-primary transition-colors" style={{ color: 'var(--text-primary)' }}>
                    {note.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {note.content.replace(/\n/g, ' ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground font-mono">
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
