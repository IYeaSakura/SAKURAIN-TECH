/**
 * Style preset registry.
 *
 * Each preset defines a complete visual personality for the site:
 * colors, fonts, radius, and optional layout shell. The default preset
 * preserves the existing light/dark theme system. The terminal preset
 * switches the entire UI into an IDE/editor aesthetic.
 */

export type StylePresetId = 'default' | 'terminal';

export interface StylePreset {
  id: StylePresetId;
  name: string;
  shortName: string;
  description: string;
  icon: 'layout' | 'terminal';
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'default',
    name: 'Default',
    shortName: 'DFT',
    description: 'The current SAKURAIN visual style.',
    icon: 'layout',
  },
  {
    id: 'terminal',
    name: 'Terminal IDE',
    shortName: 'TER',
    description: 'A monochrome developer console with phosphor accents.',
    icon: 'terminal',
  },
];

export const DEFAULT_STYLE_PRESET: StylePresetId = 'default';

export const STYLE_PRESET_STORAGE_KEY = 'sakurain-style-preset';
