'use client';

/**
 * RecentDevLog — recent dev-log list body.
 *
 * The outer chrome is provided by WidgetFrame on the homepage.
 */

import { motion } from 'framer-motion';
import { useAnimationEnabled, useNavigation, useTranslation } from '@/hooks';
import type { Note } from '@/lib/content/notes';

interface RecentDevLogProps {
  notes: Note[];
  maxItems?: number;
}

export function RecentDevLog({ notes, maxItems = 5 }: RecentDevLogProps) {
  const animationEnabled = useAnimationEnabled();
  const { navigateTo } = useNavigation();
  const { t } = useTranslation();
  const recentNotes = notes.slice(0, maxItems);

  return (
    <div className="p-5 h-full flex flex-col" style={{ background: 'var(--bg-secondary)' }}>
      <div className="flex flex-col gap-1.5">
        {recentNotes.length === 0 ? (
          <div
            className="flex-1 flex items-center justify-center text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            {t.widgets.stats.notes}
          </div>
        ) : (
          recentNotes.map((note, index) => (
            <motion.div
              key={note.id}
              initial={animationEnabled ? { opacity: 0, x: -8 } : undefined}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => navigateTo('/dev-log')}
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
    </div>
  );
}
