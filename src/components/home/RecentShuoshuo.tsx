'use client';

/**
 * Recent shuoshuo widget for the home page.
 * Displays the latest notes from content/notes/posts and links to the full
 * shuoshuo archive.
 */

import { motion } from 'framer-motion';
import { MessageSquare, ArrowRight, Clock } from 'lucide-react';
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
      transition={{ duration: 0.4, delay: 0.2 }}
      className="card-minimal p-4 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-accent-secondary" />
          <span className="mono-label">RECENT_SHUOSHUO</span>
        </div>
        <button
          onClick={() => navigateTo('/shuoshuo')}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-accent-primary transition-colors font-mono"
        >
          VIEW_ALL
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 flex flex-col gap-3">
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
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => navigateTo('/shuoshuo')}
              className="group cursor-pointer p-2.5 rounded-md border border-transparent hover:border-border/40 hover:bg-muted/10 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-accent-primary transition-colors">
                    {note.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {note.content.replace(/\n/g, ' ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground font-mono">
                <Clock className="w-3 h-3" />
                <span>{note.fullDate}</span>
                <span className="mx-1">·</span>
                <span>{note.fullTime}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
