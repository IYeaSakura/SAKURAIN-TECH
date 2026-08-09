'use client';

/**
 * SearchProvider — global search state and keyboard shortcut.
 *
 * Wraps the app so any component can open the Command Palette via a shared
 * hook. Cmd/Ctrl+K toggles the palette; the index is fetched on first open.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { SearchIndex } from '@/lib/search';
import { loadSearchIndex } from '@/lib/search';

interface SearchContextValue {
  isOpen: boolean;
  index: SearchIndex | null;
  indexLoading: boolean;
  indexError: string | null;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function useGlobalSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useGlobalSearch must be used within SearchProvider');
  }
  return context;
}

interface SearchProviderProps {
  children: React.ReactNode;
}

export function SearchProvider({ children }: SearchProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [indexLoading, setIndexLoading] = useState(false);
  const [indexError, setIndexError] = useState<string | null>(null);

  const open = useCallback(() => {
    setIsOpen(true);
    if (!index && !indexLoading && !indexError) {
      setIndexLoading(true);
      loadSearchIndex()
        .then(setIndex)
        .catch((err) => setIndexError(err instanceof Error ? err.message : String(err)))
        .finally(() => setIndexLoading(false));
    }
  }, [index, indexLoading, indexError]);

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  const value: SearchContextValue = {
    isOpen,
    index,
    indexLoading,
    indexError,
    open,
    close,
    toggle,
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}
