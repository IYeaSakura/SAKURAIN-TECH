/**
 * Color theme registry.
 *
 * Each theme provides a complete palette for both light and dark modes.
 * The SettingsContext maps these values onto CSS custom properties at runtime,
 * so users can switch themes without rebuilding the site.
 */

export type ColorThemeId =
  | 'tech-blue'
  | 'brutalist'
  | 'terminal-green'
  | 'cyber-neon'
  | 'pixel-purple'
  | 'amber-retro';

export interface ColorTheme {
  id: ColorThemeId;
  name: string;
  description: string;
  preview: string;
  light: ThemeColorTokens;
  dark: ThemeColorTokens;
}

export interface ThemeColorTokens {
  '--bg-primary': string;
  '--bg-secondary': string;
  '--bg-tertiary': string;
  '--bg-card': string;
  '--accent-primary': string;
  '--accent-secondary': string;
  '--accent-tertiary': string;
  '--accent-glow': string;
  '--text-primary': string;
  '--text-secondary': string;
  '--text-muted': string;
  '--border-subtle': string;
  '--border-glow': string;
  '--success': string;
  '--warning': string;
  '--error': string;
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'tech-blue',
    name: '科技蓝',
    description: '默认主题，冷静的开发者蓝调。',
    preview: '#0E639C',
    light: {
      '--bg-primary': '#f4f4f0',
      '--bg-secondary': '#ffffff',
      '--bg-tertiary': '#e8e8e4',
      '--bg-card': '#ffffff',
      '--accent-primary': '#0E639C',
      '--accent-secondary': '#569CD6',
      '--accent-tertiary': '#05d9e8',
      '--accent-glow': 'rgba(14, 99, 156, 0.25)',
      '--text-primary': '#111111',
      '--text-secondary': '#3c3c3c',
      '--text-muted': '#777777',
      '--border-subtle': '#111111',
      '--border-glow': '#0E639C',
      '--success': '#00c853',
      '--warning': '#ff9100',
      '--error': '#ff1744',
    },
    dark: {
      '--bg-primary': '#0a0a0a',
      '--bg-secondary': '#111111',
      '--bg-tertiary': '#1a1a1a',
      '--bg-card': '#111111',
      '--accent-primary': '#569CD6',
      '--accent-secondary': '#4EC9B0',
      '--accent-tertiary': '#00e5ff',
      '--accent-glow': 'rgba(86, 156, 214, 0.3)',
      '--text-primary': '#f5f5f0',
      '--text-secondary': '#b0b0b0',
      '--text-muted': '#666666',
      '--border-subtle': '#ffffff',
      '--border-glow': '#569CD6',
      '--success': '#00e676',
      '--warning': '#ffab40',
      '--error': '#ff5252',
    },
  },
  {
    id: 'brutalist',
    name: '新粗犷主义',
    description: '高对比、粗边框、荧光粉强调色。',
    preview: '#ff2a6d',
    light: {
      '--bg-primary': '#f4f4f0',
      '--bg-secondary': '#ffffff',
      '--bg-tertiary': '#e6e6e2',
      '--bg-card': '#ffffff',
      '--accent-primary': '#111111',
      '--accent-secondary': '#ff2a6d',
      '--accent-tertiary': '#05d9e8',
      '--accent-glow': 'rgba(255, 42, 109, 0.25)',
      '--text-primary': '#111111',
      '--text-secondary': '#444444',
      '--text-muted': '#777777',
      '--border-subtle': '#111111',
      '--border-glow': '#ff2a6d',
      '--success': '#00c853',
      '--warning': '#ff9100',
      '--error': '#ff1744',
    },
    dark: {
      '--bg-primary': '#0a0a0a',
      '--bg-secondary': '#111111',
      '--bg-tertiary': '#1a1a1a',
      '--bg-card': '#111111',
      '--accent-primary': '#ffffff',
      '--accent-secondary': '#00ff41',
      '--accent-tertiary': '#00e5ff',
      '--accent-glow': 'rgba(0, 255, 65, 0.25)',
      '--text-primary': '#f5f5f0',
      '--text-secondary': '#a0a0a0',
      '--text-muted': '#666666',
      '--border-subtle': '#ffffff',
      '--border-glow': '#00ff41',
      '--success': '#00e676',
      '--warning': '#ffab40',
      '--error': '#ff5252',
    },
  },
  {
    id: 'terminal-green',
    name: '终端磷光绿',
    description: '复古 CRT 显示器风格的单色绿。',
    preview: '#00ff41',
    light: {
      '--bg-primary': '#f0f4f0',
      '--bg-secondary': '#ffffff',
      '--bg-tertiary': '#e0e8e0',
      '--bg-card': '#ffffff',
      '--accent-primary': '#003b00',
      '--accent-secondary': '#008f11',
      '--accent-tertiary': '#00ff41',
      '--accent-glow': 'rgba(0, 255, 65, 0.25)',
      '--text-primary': '#003b00',
      '--text-secondary': '#2a4a2a',
      '--text-muted': '#5a7a5a',
      '--border-subtle': '#003b00',
      '--border-glow': '#00ff41',
      '--success': '#00c853',
      '--warning': '#ff9100',
      '--error': '#ff1744',
    },
    dark: {
      '--bg-primary': '#000000',
      '--bg-secondary': '#0a0a0a',
      '--bg-tertiary': '#111111',
      '--bg-card': '#0a0a0a',
      '--accent-primary': '#00ff41',
      '--accent-secondary': '#008f11',
      '--accent-tertiary': '#33ff33',
      '--accent-glow': 'rgba(0, 255, 65, 0.35)',
      '--text-primary': '#00ff41',
      '--text-secondary': '#33ff33',
      '--text-muted': '#008f11',
      '--border-subtle': '#00ff41',
      '--border-glow': '#00ff41',
      '--success': '#00ff41',
      '--warning': '#ff9100',
      '--error': '#ff1744',
    },
  },
  {
    id: 'cyber-neon',
    name: '赛博霓虹',
    description: '粉青霓虹，适合夜间浏览。',
    preview: '#ff00ff',
    light: {
      '--bg-primary': '#f8f0f8',
      '--bg-secondary': '#ffffff',
      '--bg-tertiary': '#f0e8f0',
      '--bg-card': '#ffffff',
      '--accent-primary': '#ff00ff',
      '--accent-secondary': '#00ffff',
      '--accent-tertiary': '#ff2a6d',
      '--accent-glow': 'rgba(255, 0, 255, 0.25)',
      '--text-primary': '#1a0a1a',
      '--text-secondary': '#4a3a4a',
      '--text-muted': '#8a7a8a',
      '--border-subtle': '#1a0a1a',
      '--border-glow': '#ff00ff',
      '--success': '#00c853',
      '--warning': '#ff9100',
      '--error': '#ff1744',
    },
    dark: {
      '--bg-primary': '#0a0a12',
      '--bg-secondary': '#12121f',
      '--bg-tertiary': '#1a1a2e',
      '--bg-card': '#12121f',
      '--accent-primary': '#ff00ff',
      '--accent-secondary': '#00ffff',
      '--accent-tertiary': '#ff2a6d',
      '--accent-glow': 'rgba(255, 0, 255, 0.35)',
      '--text-primary': '#f0e8f8',
      '--text-secondary': '#c0b8d0',
      '--text-muted': '#706880',
      '--border-subtle': '#ff00ff',
      '--border-glow': '#00ffff',
      '--success': '#00e676',
      '--warning': '#ffab40',
      '--error': '#ff5252',
    },
  },
  {
    id: 'pixel-purple',
    name: '像素紫',
    description: '紫粉渐变，像素游戏氛围。',
    preview: '#6b46c1',
    light: {
      '--bg-primary': '#f5f0fa',
      '--bg-secondary': '#ffffff',
      '--bg-tertiary': '#ebe5f2',
      '--bg-card': '#ffffff',
      '--accent-primary': '#6b46c1',
      '--accent-secondary': '#ec4899',
      '--accent-tertiary': '#8b5cf6',
      '--accent-glow': 'rgba(107, 70, 193, 0.25)',
      '--text-primary': '#1a1033',
      '--text-secondary': '#4a3a5c',
      '--text-muted': '#8a7a9a',
      '--border-subtle': '#1a1033',
      '--border-glow': '#6b46c1',
      '--success': '#00c853',
      '--warning': '#ff9100',
      '--error': '#ff1744',
    },
    dark: {
      '--bg-primary': '#0f0a1a',
      '--bg-secondary': '#1a1033',
      '--bg-tertiary': '#251a44',
      '--bg-card': '#1a1033',
      '--accent-primary': '#a78bfa',
      '--accent-secondary': '#f472b6',
      '--accent-tertiary': '#c4b5fd',
      '--accent-glow': 'rgba(167, 139, 250, 0.35)',
      '--text-primary': '#f5f0fa',
      '--text-secondary': '#c4b5fd',
      '--text-muted': '#8a7a9a',
      '--border-subtle': '#a78bfa',
      '--border-glow': '#f472b6',
      '--success': '#00e676',
      '--warning': '#ffab40',
      '--error': '#ff5252',
    },
  },
  {
    id: 'amber-retro',
    name: '琥珀复古',
    description: '暖琥珀与深灰，80年代终端感。',
    preview: '#ff8c00',
    light: {
      '--bg-primary': '#f4f2ed',
      '--bg-secondary': '#ffffff',
      '--bg-tertiary': '#e8e4dc',
      '--bg-card': '#ffffff',
      '--accent-primary': '#1a1a1a',
      '--accent-secondary': '#ff8c00',
      '--accent-tertiary': '#ffaa33',
      '--accent-glow': 'rgba(255, 140, 0, 0.25)',
      '--text-primary': '#1a1a1a',
      '--text-secondary': '#4a4a4a',
      '--text-muted': '#8a8a8a',
      '--border-subtle': '#1a1a1a',
      '--border-glow': '#ff8c00',
      '--success': '#00c853',
      '--warning': '#ff9100',
      '--error': '#ff1744',
    },
    dark: {
      '--bg-primary': '#12100c',
      '--bg-secondary': '#1a1814',
      '--bg-tertiary': '#24201a',
      '--bg-card': '#1a1814',
      '--accent-primary': '#ff8c00',
      '--accent-secondary': '#ffaa33',
      '--accent-tertiary': '#ffcc66',
      '--accent-glow': 'rgba(255, 140, 0, 0.35)',
      '--text-primary': '#f4f2ed',
      '--text-secondary': '#d8d4cc',
      '--text-muted': '#8a8680',
      '--border-subtle': '#ff8c00',
      '--border-glow': '#ffaa33',
      '--success': '#00e676',
      '--warning': '#ffab40',
      '--error': '#ff5252',
    },
  },
];

export const DEFAULT_COLOR_THEME: ColorThemeId = 'tech-blue';

export function findColorTheme(id: ColorThemeId | string | null): ColorTheme {
  return (
    COLOR_THEMES.find((t) => t.id === id) ??
    COLOR_THEMES.find((t) => t.id === DEFAULT_COLOR_THEME)!
  );
}
