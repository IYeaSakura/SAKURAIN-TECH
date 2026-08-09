'use client';

/**
 * SearchWidget — homepage entry point for the global Command Palette search.
 *
 * Clicking the input opens the unified site search so the homepage widget
 * stays compact while offering the same full-text capabilities as the
 * Dynamic Island shortcut.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Command } from 'lucide-react';
import { useTranslation, useAnimationEnabled } from '@/hooks';
import { useGlobalSearch } from '@/components/search';

export function SearchWidget() {
  const { t, locale } = useTranslation();
  const animationEnabled = useAnimationEnabled();
  const { open: openSearch } = useGlobalSearch();
  const [focused, setFocused] = useState(false);

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

      <button
        onClick={openSearch}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="relative flex items-center gap-2 border-2 w-full text-left transition-colors hover:bg-[var(--bg-tertiary)]"
        style={{
          borderColor: focused ? 'var(--accent-primary)' : 'var(--border-subtle)',
          background: 'var(--bg-primary)',
        }}
      >
        <Search className="w-4 h-4 ml-3" style={{ color: 'var(--text-muted)' }} />
        <span
          className="flex-1 px-2 py-2.5 text-sm font-mono outline-none"
          style={{ color: 'var(--text-muted)' }}
        >
          {t.widgets.searchPlaceholder}
        </span>
        <kbd
          className="hidden sm:inline-flex items-center gap-0.5 mr-3 px-1.5 py-0.5 text-[10px] font-mono border"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
        >
          {locale === 'zh' ? 'Ctrl' : '⌘'} K
        </kbd>
        <Command className="w-3 h-3 mr-3 sm:hidden" style={{ color: 'var(--text-muted)' }} />
      </button>

      <p className="mt-3 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
        {locale === 'zh'
          ? '搜索文章、日志、文档、友链与页面'
          : 'Search posts, notes, docs, friends and pages'}
      </p>
    </motion.div>
  );
}
