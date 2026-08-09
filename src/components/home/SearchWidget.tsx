'use client';

/**
 * SearchWidget — homepage body for the global Command Palette search.
 *
 * The outer chrome is provided by WidgetFrame on the homepage.
 */

import { useState } from 'react';
import { Search, Command } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { useGlobalSearch } from '@/components/search';

export function SearchWidget() {
  const { t, locale } = useTranslation();
  const { open: openSearch } = useGlobalSearch();
  const [focused, setFocused] = useState(false);

  return (
    <div className="p-5 h-full min-h-[120px] flex flex-col" style={{ background: 'var(--bg-secondary)' }}>
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
    </div>
  );
}
