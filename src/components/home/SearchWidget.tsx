'use client';

/**
 * SearchWidget —— client-side search across posts and notes.
 *
 * Filters the injected content as the user types and navigates to the
 * selected result with the internal router.
 */

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, FileText, MessageSquare } from 'lucide-react';
import { useTranslation, useAnimationEnabled, useNavigation } from '@/hooks';
import type { BlogPost } from '@/components/blog/types';
import type { Note } from '@/lib/content/notes';

interface SearchWidgetProps {
  posts: BlogPost[];
  notes: Note[];
}

interface SearchResult {
  type: 'post' | 'note';
  title: string;
  href: string;
  date?: string;
}

export function SearchWidget({ posts, notes }: SearchWidgetProps) {
  const { t } = useTranslation();
  const animationEnabled = useAnimationEnabled();
  const { navigateTo } = useNavigation();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matchedPosts = posts
      .filter((post) => post.title?.toLowerCase().includes(q) || post.description?.toLowerCase().includes(q))
      .slice(0, 3)
      .map((post) => ({
        type: 'post' as const,
        title: post.title,
        href: `/blog/${post.slug}`,
        date: post.date,
      }));

    const matchedNotes = notes
      .filter((note) => note.content?.toLowerCase().includes(q))
      .slice(0, 2)
      .map((note) => ({
        type: 'note' as const,
        title: note.content.slice(0, 40) + (note.content.length > 40 ? '...' : ''),
        href: `/dev-log#note-${note.id}`,
        date: note.date,
      }));

    return [...matchedPosts, ...matchedNotes];
  }, [query, posts, notes]);

  const showResults = focused && query.trim().length > 0;

  return (
    <motion.div
      initial={animationEnabled ? { opacity: 0, y: 16 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative h-full min-h-[120px] p-5 border-2 flex flex-col"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-subtle)',
        boxShadow: '4px 4px 0 var(--border-subtle)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Search className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
        <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {t.widgets.search}
        </span>
      </div>

      <div
        className="relative flex items-center border-2"
        style={{ borderColor: focused ? 'var(--accent-primary)' : 'var(--border-subtle)', background: 'var(--bg-primary)' }}
      >
        <Search className="w-4 h-4 ml-3" style={{ color: 'var(--text-muted)' }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={t.widgets.searchPlaceholder}
          className="w-full px-3 py-2.5 bg-transparent text-sm outline-none font-mono"
          style={{ color: 'var(--text-primary)' }}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="mr-2 p-1"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-0 right-0 top-full mt-2 mx-5 z-20 border-2 overflow-hidden"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
          >
            {results.length === 0 ? (
              <div className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                {t.widgets.searchEmpty}
              </div>
            ) : (
              results.map((result) => (
                <button
                  key={result.href}
                  onClick={() => navigateTo(result.href)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left border-b last:border-b-0 transition-colors hover:opacity-80"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-secondary)' }}
                >
                  {result.type === 'post' ? (
                    <FileText className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                  ) : (
                    <MessageSquare className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-secondary)' }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                      {result.title}
                    </p>
                    {result.date && (
                      <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                        {result.date}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
