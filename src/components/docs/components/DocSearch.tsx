import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import type { SearchResult } from '../hooks';

interface DocSearchProps {
  onSearch: (query: string) => SearchResult[];
  onSelectResult: (result: SearchResult) => void;
  placeholder?: string;
}

export function DocSearch({ onSearch, onSelectResult, placeholder = '搜索本文档...' }: DocSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 防抖搜索
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    const timer = setTimeout(() => {
      const searchResults = onSearch(query);
      setResults(searchResults);
      setSelectedIndex(0);
      setIsSearching(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + F 打开搜索
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      
      // ESC 关闭搜索
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 处理搜索结果导航
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
    }
  }, [results, selectedIndex]);

  const handleSelect = (result: SearchResult) => {
    onSelectResult(result);
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      {/* 搜索按钮 */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
        style={{ 
          background: isOpen ? 'var(--accent-primary)' : 'var(--bg-secondary)',
          color: isOpen ? 'white' : 'var(--text-secondary)'
        }}
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">搜索</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded"
             style={{ background: isOpen ? 'rgba(255,255,255,0.2)' : 'var(--bg-primary)' }}>
          Ctrl+F
        </kbd>
      </button>

      {/* 搜索下拉框 */}
      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl shadow-2xl border overflow-hidden z-50"
          style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
        >
          {/* 输入框 */}
          <div className="flex items-center gap-2 p-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <Search className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--text-primary)' }}
              autoFocus
            />
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--text-muted)' }} />
            ) : query ? (
              <button 
                onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          {/* 搜索结果 */}
          <div className="max-h-80 overflow-y-auto">
            {query && results.length === 0 && !isSearching ? (
              <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                未找到相关内容
              </div>
            ) : (
              <div className="py-1">
                {results.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className="w-full text-left px-3 py-2.5 text-sm transition-colors"
                    style={{
                      background: selectedIndex === index ? 'var(--bg-secondary)' : 'transparent'
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span 
                        className="text-xs px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                        style={{ 
                          background: result.type === 'heading' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                          color: result.type === 'heading' ? 'white' : 'var(--text-secondary)'
                        }}
                      >
                        {result.type === 'heading' ? '标题' : '内容'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div 
                          className="truncate"
                          style={{ color: selectedIndex === index ? 'var(--accent-primary)' : 'var(--text-primary)' }}
                        >
                          {result.text}
                        </div>
                        {result.lineIndex !== undefined && (
                          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            第 {result.lineIndex + 1} 行
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 底部提示 */}
          <div 
            className="flex items-center justify-between px-3 py-1.5 text-xs border-t"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
          >
            <span>{results.length} 个结果</span>
            <div className="flex items-center gap-2">
              <span>↑↓ 选择</span>
              <span>↵ 跳转</span>
              <span>ESC 关闭</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
