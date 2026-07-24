/**
 * SettingsContext — user-controlled visual preferences.
 *
 * Manages:
 * - Color theme selection (tech-blue, brutalist, terminal-green, etc.)
 * - Border intensity
 * - Shadow intensity
 * - Reduced-motion preference
 *
 * Preferences are persisted to localStorage and restored before first paint
 * via the inline hydration script in src/app/layout.tsx.
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
  type ColorThemeId,
  findColorTheme,
  DEFAULT_COLOR_THEME,
} from '@/config/color-themes';

export interface UserSettings {
  colorTheme: ColorThemeId;
  borderIntensity: number;
  shadowIntensity: number;
  reducedMotion: boolean;
}

export const SETTINGS_STORAGE_KEY = 'sakurain-settings';

export const DEFAULT_SETTINGS: UserSettings = {
  colorTheme: DEFAULT_COLOR_THEME,
  borderIntensity: 1,
  shadowIntensity: 1,
  reducedMotion: false,
};

interface SettingsContextValue extends UserSettings {
  setColorTheme: (id: ColorThemeId) => void;
  setBorderIntensity: (value: number) => void;
  setShadowIntensity: (value: number) => void;
  setReducedMotion: (value: boolean) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function isValidColorTheme(id: unknown): id is ColorThemeId {
  return (
    typeof id === 'string' &&
    ['tech-blue', 'brutalist', 'terminal-green', 'cyber-neon', 'pixel-purple', 'amber-retro'].includes(
      id
    )
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function parseSettings(raw: string | null): UserSettings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return {
      colorTheme: isValidColorTheme(parsed.colorTheme)
        ? parsed.colorTheme
        : DEFAULT_SETTINGS.colorTheme,
      borderIntensity: clamp(
        typeof parsed.borderIntensity === 'number'
          ? parsed.borderIntensity
          : DEFAULT_SETTINGS.borderIntensity,
        0,
        2
      ),
      shadowIntensity: clamp(
        typeof parsed.shadowIntensity === 'number'
          ? parsed.shadowIntensity
          : DEFAULT_SETTINGS.shadowIntensity,
        0,
        2
      ),
      reducedMotion: typeof parsed.reducedMotion === 'boolean'
        ? parsed.reducedMotion
        : DEFAULT_SETTINGS.reducedMotion,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function getCurrentThemeMode(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light';
}

function applyColorTokens(themeId: ColorThemeId) {
  if (typeof document === 'undefined') return;
  const theme = findColorTheme(themeId);
  const mode = getCurrentThemeMode();
  const tokens = mode === 'dark' ? theme.dark : theme.light;
  Object.entries(tokens).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
  document.documentElement.setAttribute('data-color-theme', themeId);
}

function applyIntensity(borderIntensity: number, shadowIntensity: number) {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--border-weight', String(borderIntensity));
  document.documentElement.style.setProperty('--shadow-weight', String(shadowIntensity));
}

export function SettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettingsState] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  // Restore settings after hydration to avoid SSR mismatch.
  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const restored = parseSettings(stored);
    setSettingsState(restored);
    applyColorTokens(restored.colorTheme);
    applyIntensity(restored.borderIntensity, restored.shadowIntensity);
    setHydrated(true);
  }, []);

  // Re-apply tokens when the light/dark mode changes (useTheme toggles data-theme).
  useEffect(() => {
    if (!hydrated) return;
    const observer = new MutationObserver(() => {
      applyColorTokens(settings.colorTheme);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, [hydrated, settings.colorTheme]);

  const persist = useCallback((next: UserSettings) => {
    setSettingsState(next);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    applyColorTokens(next.colorTheme);
    applyIntensity(next.borderIntensity, next.shadowIntensity);
  }, []);

  const setColorTheme = useCallback(
    (id: ColorThemeId) => {
      persist({ ...settings, colorTheme: id });
    },
    [persist, settings]
  );

  const setBorderIntensity = useCallback(
    (value: number) => {
      persist({ ...settings, borderIntensity: clamp(value, 0, 2) });
    },
    [persist, settings]
  );

  const setShadowIntensity = useCallback(
    (value: number) => {
      persist({ ...settings, shadowIntensity: clamp(value, 0, 2) });
    },
    [persist, settings]
  );

  const setReducedMotion = useCallback(
    (value: boolean) => {
      persist({ ...settings, reducedMotion: value });
    },
    [persist, settings]
  );

  const resetSettings = useCallback(() => {
    persist(DEFAULT_SETTINGS);
  }, [persist]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...settings,
      setColorTheme,
      setBorderIntensity,
      setShadowIntensity,
      setReducedMotion,
      resetSettings,
    }),
    [
      settings,
      setColorTheme,
      setBorderIntensity,
      setShadowIntensity,
      setReducedMotion,
      resetSettings,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}
