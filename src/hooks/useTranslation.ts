'use client';

/**
 * useTranslation — convenience hook over LanguageContext.
 *
 * Returns the active dictionary as `t`, the current locale, and locale
 * mutators. Prefer this hook in components that need translated UI text.
 */

import { useLanguage } from '@/contexts/LanguageContext';

/** Replace {key} placeholders in a translation string with values. */
export function tReplace(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? `{${key}}`));
}

export function useTranslation() {
  const { locale, setLocale, toggleLocale, dictionary: t, supportedLocales } = useLanguage();
  return { t, locale, setLocale, toggleLocale, supportedLocales, tReplace };
}
