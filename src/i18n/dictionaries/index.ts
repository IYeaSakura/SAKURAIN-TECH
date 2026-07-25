/**
 * i18n dictionary registry.
 *
 * Maps each supported locale to its Dictionary and exposes a lookup helper.
 */

import type { Dictionary, Locale } from '../types';
import { en } from './en';
import { zh } from './zh';

export const dictionaries: Record<Locale, Dictionary> = {
  en,
  zh,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}
