import { useState, useEffect, useMemo } from 'react';
import { Search, X, BookOpen, FileText, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { DocCategory, DocItem, DocSeries, Chapter } from '../types';

interface SearchResult {
  item: DocItem;
  category: DocCategory;
  chapter?: Chapter;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  allCategories: DocCategory[];
  onSelectItem: (category: DocCategory, item: DocItem) => void;
  onSelectChapter?: (category: DocCategory, series: DocSeries, chapter: Chapter) => void;
}

export function SearchModal({ isOpen, onClose, allCategories, onSelectItem, onSelectChapter }: SearchModalProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    const searchResults: SearchResult[] = [];

    allCategories.forEach((category) => {
      category.items.forEach((item) => {
        if (item.title.toLowerCase().includes(lowerQuery) || 
            item.description.toLowerCase().includes(lowerQuery)) {
          searchResults.push({ item, category });
        }
        
        if (item.type === 'series') {
          item.chapters.forEach((chapter) => {
            if (chapter.title.toLowerCase().includes(lowerQuery) ||
                chapter.description.toLowerCase().includes(lowerQuery)) {
              searchResults.push({ item, category, chapter });
            }
          });
        }
      });
    });

    return searchResults.slice(0, 20);
  }, [query, allCategories]);

  const handleSelect = (result: SearchResult) => {
    if (result.chapter && result.item.type === 'series' && onSelectChapter) {
      onSelectChapter(result.category, result.item, result.chapter);
    } else {
      onSelectItem(result.category, result.item);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="relative w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <Search className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索文档、章节..."
            className="flex-1 bg-transparent outline-none text-base"
            style={{ color: 'var(--text-primary)' }}
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ color: 'var(--text-muted)' }}>
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
              {query ? '未找到相关结果' : '输入关键词搜索文档、章节...'}
            </div>
          ) : (
            <div className="p-2">
              {results.map((result, index) => (
                <button
                  key={`${result.item.id}-${result.chapter?.id || 'item'}-${index}`}
                  onClick={() => handleSelect(result)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors hover:opacity-80"
                  style={{ background: index % 2 === 0 ? 'transparent' : 'var(--bg-secondary)' }}
                >
                  {result.item.type === 'series' ? (
                    <BookOpen className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                  ) : (
                    <FileText className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {result.chapter ? result.chapter.title : result.item.title}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                        {result.category.name}
                      </span>
                    </div>
                    <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>
                      {result.chapter ? `${result.item.title} - ${result.chapter.description}` : result.item.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100" style={{ color: 'var(--text-muted)' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
