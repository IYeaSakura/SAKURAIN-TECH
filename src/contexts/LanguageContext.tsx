/**
 * LanguageContext — global locale state for EN/ZH i18n.
 *
 * Manages:
 * - Current locale (defaults to 'en')
 * - Persistence to localStorage
 * - html[lang] attribute synchronization
 * - Dictionary lookup for the active locale
 *
 * The inline hydration script in src/app/layout.tsx restores the persisted
 * locale before first paint to avoid a flash of the default language.
 */

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  type Locale,
  type Dictionary,
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
} from '@/i18n/types';
import { getDictionary } from '@/i18n/dictionaries';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  dictionary: Dictionary;
  supportedLocales: Locale[];
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isValidLocale(value: unknown): value is Locale {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as Locale);
}

function applyLocaleToDocument(locale: Locale) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('lang', locale === 'en' ? 'en' : 'zh-CN');
}

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [hydrated, setHydrated] = useState(false);

  // Restore the persisted locale after hydration to avoid SSR mismatch.
  useEffect(() => {
    const attr = document.documentElement.getAttribute('lang');
    const initialFromAttr = attr === 'zh-CN' || attr === 'zh' ? 'zh' : attr === 'en' ? 'en' : null;

    if (initialFromAttr) {
      setLocaleState(initialFromAttr);
    } else {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      const restored = isValidLocale(stored) ? stored : DEFAULT_LOCALE;
      setLocaleState(restored);
      applyLocaleToDocument(restored);
    }

    setHydrated(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    applyLocaleToDocument(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Ignore storage access errors (e.g. private browsing).
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'en' ? 'zh' : 'en');
  }, [locale, setLocale]);

  const dictionary = useMemo(() => getDictionary(locale), [locale]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      dictionary,
      supportedLocales: SUPPORTED_LOCALES,
    }),
    [locale, setLocale, toggleLocale, dictionary]
  );

  // Re-apply html[lang] whenever the locale changes (including initial render).
  useEffect(() => {
    if (hydrated) {
      applyLocaleToDocument(locale);
    }
  }, [locale, hydrated]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
