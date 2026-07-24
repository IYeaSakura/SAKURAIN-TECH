/**
 * StylePresetContext — global style preset state.
 *
 * Responsible for:
 * - Reading the persisted preset before hydration (via the data-preset attribute
 *   injected by the inline script in src/app/layout.tsx)
 * - Updating the data-preset attribute on the <html> element
 * - Persisting the selection to localStorage
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
  DEFAULT_STYLE_PRESET,
  STYLE_PRESETS,
  STYLE_PRESET_STORAGE_KEY,
  type StylePreset,
  type StylePresetId,
} from '@/config/style-presets';

interface StylePresetContextValue {
  preset: StylePreset;
  setPreset: (id: StylePresetId) => void;
  cyclePreset: () => void;
}

const StylePresetContext = createContext<StylePresetContextValue | null>(null);

function resolvePreset(id: StylePresetId | null): StylePreset {
  return STYLE_PRESETS.find((p) => p.id === id) ?? STYLE_PRESETS[0];
}

function applyPresetToDocument(id: StylePresetId) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-preset', id);
}

export function StylePresetProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [presetId, setPresetId] = useState<StylePresetId>(
    DEFAULT_STYLE_PRESET
  );

  // Initialize from the data-preset attribute set by the inline hydration script.
  useEffect(() => {
    const attr = document.documentElement.getAttribute('data-preset');
    if (attr === 'default' || attr === 'terminal') {
      setPresetId(attr);
    } else {
      const stored = localStorage.getItem(
        STYLE_PRESET_STORAGE_KEY
      ) as StylePresetId | null;
      if (stored === 'default' || stored === 'terminal') {
        setPresetId(stored);
        applyPresetToDocument(stored);
      }
    }
  }, []);

  const setPreset = useCallback((id: StylePresetId) => {
    setPresetId(id);
    applyPresetToDocument(id);
    localStorage.setItem(STYLE_PRESET_STORAGE_KEY, id);
  }, []);

  const cyclePreset = useCallback(() => {
    const currentIndex = STYLE_PRESETS.findIndex((p) => p.id === presetId);
    const nextIndex = (currentIndex + 1) % STYLE_PRESETS.length;
    setPreset(STYLE_PRESETS[nextIndex].id);
  }, [presetId, setPreset]);

  const preset = useMemo(() => resolvePreset(presetId), [presetId]);

  const value = useMemo(
    () => ({ preset, setPreset, cyclePreset }),
    [preset, setPreset, cyclePreset]
  );

  return (
    <StylePresetContext.Provider value={value}>
      {children}
    </StylePresetContext.Provider>
  );
}

export function useStylePreset(): StylePresetContextValue {
  const ctx = useContext(StylePresetContext);
  if (!ctx) {
    throw new Error(
      'useStylePreset must be used within a StylePresetProvider'
    );
  }
  return ctx;
}
