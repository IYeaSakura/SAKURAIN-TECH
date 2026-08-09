'use client';

/**
 * GlobalSearch — Command Palette style full-site search modal.
 *
 * Uses the unified search index and supports keyboard navigation, grouped
 * results and direct navigation through the internal router.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  X,
  FileText,
  MessageSquare,
  BookOpen,
  Heart,
  Briefcase,
  Layout,
  Loader2,
  CornerDownLeft,
} from 'lucide-react';
import { useAnimationEnabled, useNavigation, useTranslation } from '@/hooks';
import { searchIndex, type SearchDocumentType, type SearchResult } from '@/lib/search';
import { useGlobalSearch } from './SearchProvider';

const TYPE_ICONS: Record<SearchDocumentType, typeof FileText> = {
  post: FileText,
  note: MessageSquare,
  doc: BookOpen,
  friend: Heart,
  service: Briefcase,
  page: Layout,
};

const TYPE_LABELS_EN: Record<SearchDocumentType, string> = {
  post: 'Blog',
  note: 'Dev Log',
  doc: 'Docs',
  friend: 'Friends',
  service: 'Services',
  page: 'Pages',
};

const TYPE_LABELS_ZH: Record<SearchDocumentType, string> = {
  post: '博客',
  note: '日志',
  doc: '文档',
  friend: '友链',
  service: '服务',
  page: '页面',
};

function useTypeLabels(locale: string) {
  return useMemo(() => (locale === 'zh' ? TYPE_LABELS_ZH : TYPE_LABELS_EN), [locale]);
}

function renderExcerpt(excerpt: string) {
  const parts = excerpt.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <mark
          key={i}
          className="px-0.5 font-bold"
          style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)' }}
        >
          {part.slice(2, -2)}
        </mark>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function GlobalSearch() {
  const { isOpen, index, indexLoading, indexError, close } = useGlobalSearch();
  const { navigateTo } = useNavigation();
  const { t, locale } = useTranslation();
  const animationEnabled = useAnimationEnabled();
  const typeLabels = useTypeLabels(locale);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [matchMode, setMatchMode] = useState<'fuzzy' | 'exact'>('fuzzy');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo<SearchResult[]>(() => {
    if (!index || !query.trim()) return [];
    return searchIndex(index, query, { limit: 20, matchMode });
  }, [index, query, matchMode]);

  const groupedResults = useMemo(() => {
    const groups: Partial<Record<SearchDocumentType, SearchResult[]>> = {};
    for (const result of results) {
      const type = result.document.type;
      if (!groups[type]) groups[type] = [];
      groups[type]!.push(result);
    }
    return groups;
  }, [results]);

  const groupOrder: SearchDocumentType[] = ['post', 'doc', 'note', 'service', 'friend', 'page'];

  const groupedItems = useMemo(() => {
    const groups: Partial<
      Record<SearchDocumentType, { result: SearchResult; globalIndex: number }[]>
    > = {};
    const flat: SearchResult[] = [];
    let globalIndex = 0;
    for (const type of groupOrder) {
      const group = groupedResults[type];
      if (group?.length) {
        groups[type] = group.map((result) => {
          flat.push(result);
          return { result, globalIndex: globalIndex++ };
        });
      }
    }
    return { groups, flat, total: globalIndex };
  }, [groupedResults]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [groupedItems.total, query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }

      if (groupedItems.total === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % groupedItems.total);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + groupedItems.total) % groupedItems.total);
          break;
        case 'Enter':
          e.preventDefault();
          if (groupedItems.flat[selectedIndex]) {
            navigateTo(groupedItems.flat[selectedIndex].document.href);
            close();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, groupedItems, selectedIndex, close, navigateTo]);

  // Scroll selected item into view
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const selected = container.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement | null;
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      navigateTo(result.document.href);
      close();
    },
    [navigateTo, close]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[8vh] px-3 sm:px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={close}
      />

      <motion.div
        initial={animationEnabled ? { opacity: 0, y: -24, scale: 0.96 } : undefined}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={animationEnabled ? { opacity: 0, y: -24, scale: 0.96 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="relative w-full max-w-2xl overflow-hidden"
        style={{
          background: 'var(--bg-primary)',
          border: '2px solid var(--border-subtle)',
          boxShadow: '8px 8px 0 var(--border-subtle)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / input */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b-2"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <Search className="w-5 h-5 shrink-0" style={{ color: 'var(--accent-primary)' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`${t.common.search}...`}
            className="flex-1 bg-transparent outline-none text-sm min-w-0"
            style={{ color: 'var(--text-primary)', caretColor: 'var(--accent-primary)' }}
          />
          <button
            onClick={() => setMatchMode((prev) => (prev === 'fuzzy' ? 'exact' : 'fuzzy'))}
            className="shrink-0 px-2 py-1 text-[10px] font-mono font-bold uppercase border-2 transition-colors"
            style={{
              borderColor: matchMode === 'exact' ? 'var(--accent-primary)' : 'var(--border-subtle)',
              color: matchMode === 'exact' ? 'var(--accent-primary)' : 'var(--text-muted)',
              background: 'var(--bg-secondary)',
            }}
            title={locale === 'zh' ? '切换匹配模式' : 'Toggle match mode'}
          >
            {matchMode === 'fuzzy' ? t.widgets.searchFuzzy : t.widgets.searchExact}
          </button>
          {indexLoading ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: 'var(--text-muted)' }} />
          ) : query ? (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="shrink-0"
              style={{ color: 'var(--text-muted)' }}
              title={t.common.clear}
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
          <button
            onClick={close}
            className="shrink-0 px-2 py-1 text-[10px] font-bold uppercase border-2"
            style={{
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)',
              background: 'var(--bg-secondary)',
            }}
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
          {indexError ? (
            <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              {indexError}
            </div>
          ) : indexLoading && !index ? (
            <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              {t.common.loading}
            </div>
          ) : !query.trim() ? (
            <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              {locale === 'zh' ? '输入关键词开始全站搜索' : 'Type to search across the site'}
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {['React', '博弈', 'WebGL', '友链'].map((hint) => (
                  <button
                    key={hint}
                    onClick={() => setQuery(hint)}
                    className="px-2 py-1 text-[10px] font-mono border-2 uppercase"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          ) : groupedItems.total === 0 ? (
            <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              {t.widgets.searchEmpty}
            </div>
          ) : (
            <div className="py-2">
              {groupOrder.map((type) => {
                const group = groupedItems.groups[type];
                if (!group?.length) return null;
                const TypeIcon = TYPE_ICONS[type];
                return (
                  <section key={type} className="mb-2 last:mb-0">
                    <div
                      className="sticky top-0 z-10 flex items-center gap-2 px-4 py-1.5 border-b-2 text-[10px] font-mono uppercase tracking-wider"
                      style={{
                        borderColor: 'var(--border-subtle)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <TypeIcon className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} />
                      <span>{typeLabels[type]}</span>
                      <span className="ml-auto">{group.length}</span>
                    </div>
                    {group.map(({ result, globalIndex }) => {
                      const isSelected = globalIndex === selectedIndex;
                      return (
                        <button
                          key={result.document.id}
                          data-index={globalIndex}
                          onClick={() => handleSelect(result)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className="w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors"
                          style={{
                            background: isSelected ? 'var(--bg-tertiary)' : 'transparent',
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span
                                className="text-xs font-bold truncate"
                                style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}
                              >
                                {result.document.title}
                              </span>
                            </div>
                            <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                              {renderExcerpt(result.excerpt)}
                            </p>
                            {result.document.date && (
                              <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                {result.document.date}
                              </p>
                            )}
                          </div>

                          {isSelected && (
                            <CornerDownLeft className="w-4 h-4 shrink-0 mt-1" style={{ color: 'var(--accent-primary)' }} />
                          )}
                        </button>
                      );
                    })}
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div
          className="flex items-center justify-between px-4 py-2 border-t-2 text-[10px] font-mono"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
        >
          <span>
            {groupedItems.total > 0 ? `${groupedItems.total} ${locale === 'zh' ? '个结果' : 'results'}` : ''}
          </span>
          <div className="flex items-center gap-3">
            <span>↑↓ {locale === 'zh' ? '选择' : 'Select'}</span>
            <span>↵ {locale === 'zh' ? '跳转' : 'Open'}</span>
            <span>ESC {t.common.close}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
