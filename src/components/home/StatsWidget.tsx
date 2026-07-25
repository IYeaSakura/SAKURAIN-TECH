'use client';

/**
 * StatsWidget —— homepage statistics card.
 *
 * Displays lightweight counts for recent posts, shuoshuo and unique tags
 * to give visitors a quick sense of site activity.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, MessageSquare, Tag } from 'lucide-react';
import { useAnimationEnabled, useTranslation } from '@/hooks';
import type { BlogPost } from '@/components/blog/types';
import type { Note } from '@/lib/content/notes';

interface StatsWidgetProps {
  posts: BlogPost[];
  notes: Note[];
}

export function StatsWidget({ posts, notes }: StatsWidgetProps) {
  const animationEnabled = useAnimationEnabled();
  const { t } = useTranslation();

  const tagCount = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach((post) => post.tags?.forEach((tag) => tags.add(tag)));
    return tags.size;
  }, [posts]);

  const items = [
    { icon: FileText, label: t.widgets.stats.posts, value: posts.length },
    { icon: MessageSquare, label: t.widgets.stats.notes, value: notes.length },
    { icon: Tag, label: t.widgets.stats.tags, value: tagCount },
  ];

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="p-5 h-full border-2"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-subtle)',
        boxShadow: '4px 4px 0 var(--border-subtle)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
        <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {t.widgets.stats.title}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <div
              className="w-10 h-10 flex items-center justify-center mx-auto mb-2 border-2"
              style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}
            >
              <item.icon className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {item.value}
            </p>
            <p className="text-[10px] font-mono uppercase" style={{ color: 'var(--text-muted)' }}>
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
