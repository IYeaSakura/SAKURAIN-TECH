import type { Metadata } from "next";
import ClientEffects from "@/components/ClientEffects";
import { SearchProvider, GlobalSearch } from "@/components/search";
import { StylePresetProvider } from "@/contexts/StylePresetContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import "./globals.css";
import "./fonts/google-fonts.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sakurain.net"),
  title: "SAKURAIN | 2026",
  description: "SAKURAIN personal brand site — a practical, insightful and fun portal for tech creators.",
};

/**
 * Hydration script: restore the persisted locale, style preset, color theme and
 * user settings before the first paint to prevent a flash of defaults.
 */
const LOCALE_HYDRATION_SCRIPT = `
(function () {
  try {
    const locale = localStorage.getItem('sakurain-locale') || 'en';
    if (locale === 'zh') {
      document.documentElement.setAttribute('lang', 'zh-CN');
    } else {
      document.documentElement.setAttribute('lang', 'en');
    }
  } catch (e) {
    document.documentElement.setAttribute('lang', 'en');
  }
})();
`;

const THEME_HYDRATION_SCRIPT = `
(function () {
  try {
    const preset = localStorage.getItem('sakurain-style-preset') || 'default';
    if (preset === 'default' || preset === 'terminal') {
      document.documentElement.setAttribute('data-preset', preset);
    }
    const theme = localStorage.getItem('sakurain-theme') || 'dark';
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    const settingsRaw = localStorage.getItem('sakurain-settings');
    const settings = settingsRaw ? JSON.parse(settingsRaw) : {};
    const validThemes = ['tech-blue', 'brutalist', 'terminal-green', 'cyber-neon', 'pixel-purple', 'amber-retro'];
    const colorTheme = validThemes.indexOf(settings.colorTheme) >= 0 ? settings.colorTheme : 'tech-blue';
    document.documentElement.setAttribute('data-color-theme', colorTheme);
    const themeMap = {
      'tech-blue': {
        light: { '--bg-primary': '#f4f4f0', '--bg-secondary': '#ffffff', '--bg-tertiary': '#e8e8e4', '--bg-card': '#ffffff', '--accent-primary': '#0E639C', '--accent-secondary': '#569CD6', '--accent-tertiary': '#05d9e8', '--accent-glow': 'rgba(14, 99, 156, 0.25)', '--text-primary': '#111111', '--text-secondary': '#3c3c3c', '--text-muted': '#777777', '--border-subtle': '#111111', '--border-glow': '#0E639C', '--success': '#00c853', '--warning': '#ff9100', '--error': '#ff1744' },
        dark: { '--bg-primary': '#0a0a0a', '--bg-secondary': '#111111', '--bg-tertiary': '#1a1a1a', '--bg-card': '#111111', '--accent-primary': '#569CD6', '--accent-secondary': '#4EC9B0', '--accent-tertiary': '#00e5ff', '--accent-glow': 'rgba(86, 156, 214, 0.3)', '--text-primary': '#f5f5f0', '--text-secondary': '#b0b0b0', '--text-muted': '#666666', '--border-subtle': '#ffffff', '--border-glow': '#569CD6', '--success': '#00e676', '--warning': '#ffab40', '--error': '#ff5252' }
      },
      'brutalist': {
        light: { '--bg-primary': '#f4f4f0', '--bg-secondary': '#ffffff', '--bg-tertiary': '#e6e6e2', '--bg-card': '#ffffff', '--accent-primary': '#111111', '--accent-secondary': '#ff2a6d', '--accent-tertiary': '#05d9e8', '--accent-glow': 'rgba(255, 42, 109, 0.25)', '--text-primary': '#111111', '--text-secondary': '#444444', '--text-muted': '#777777', '--border-subtle': '#111111', '--border-glow': '#ff2a6d', '--success': '#00c853', '--warning': '#ff9100', '--error': '#ff1744' },
        dark: { '--bg-primary': '#0a0a0a', '--bg-secondary': '#111111', '--bg-tertiary': '#1a1a1a', '--bg-card': '#111111', '--accent-primary': '#ffffff', '--accent-secondary': '#00ff41', '--accent-tertiary': '#00e5ff', '--accent-glow': 'rgba(0, 255, 65, 0.25)', '--text-primary': '#f5f5f0', '--text-secondary': '#a0a0a0', '--text-muted': '#666666', '--border-subtle': '#ffffff', '--border-glow': '#00ff41', '--success': '#00e676', '--warning': '#ffab40', '--error': '#ff5252' }
      },
      'terminal-green': {
        light: { '--bg-primary': '#f0f4f0', '--bg-secondary': '#ffffff', '--bg-tertiary': '#e0e8e0', '--bg-card': '#ffffff', '--accent-primary': '#003b00', '--accent-secondary': '#008f11', '--accent-tertiary': '#00ff41', '--accent-glow': 'rgba(0, 255, 65, 0.25)', '--text-primary': '#003b00', '--text-secondary': '#2a4a2a', '--text-muted': '#5a7a5a', '--border-subtle': '#003b00', '--border-glow': '#00ff41', '--success': '#00c853', '--warning': '#ff9100', '--error': '#ff1744' },
        dark: { '--bg-primary': '#000000', '--bg-secondary': '#0a0a0a', '--bg-tertiary': '#111111', '--bg-card': '#0a0a0a', '--accent-primary': '#00ff41', '--accent-secondary': '#008f11', '--accent-tertiary': '#33ff33', '--accent-glow': 'rgba(0, 255, 65, 0.35)', '--text-primary': '#00ff41', '--text-secondary': '#33ff33', '--text-muted': '#008f11', '--border-subtle': '#00ff41', '--border-glow': '#00ff41', '--success': '#00ff41', '--warning': '#ff9100', '--error': '#ff1744' }
      },
      'cyber-neon': {
        light: { '--bg-primary': '#f8f0f8', '--bg-secondary': '#ffffff', '--bg-tertiary': '#f0e8f0', '--bg-card': '#ffffff', '--accent-primary': '#ff00ff', '--accent-secondary': '#00ffff', '--accent-tertiary': '#ff2a6d', '--accent-glow': 'rgba(255, 0, 255, 0.25)', '--text-primary': '#1a0a1a', '--text-secondary': '#4a3a4a', '--text-muted': '#8a7a8a', '--border-subtle': '#1a0a1a', '--border-glow': '#ff00ff', '--success': '#00c853', '--warning': '#ff9100', '--error': '#ff1744' },
        dark: { '--bg-primary': '#0a0a12', '--bg-secondary': '#12121f', '--bg-tertiary': '#1a1a2e', '--bg-card': '#12121f', '--accent-primary': '#ff00ff', '--accent-secondary': '#00ffff', '--accent-tertiary': '#ff2a6d', '--accent-glow': 'rgba(255, 0, 255, 0.35)', '--text-primary': '#f0e8f8', '--text-secondary': '#c0b8d0', '--text-muted': '#706880', '--border-subtle': '#ff00ff', '--border-glow': '#00ffff', '--success': '#00e676', '--warning': '#ffab40', '--error': '#ff5252' }
      },
      'pixel-purple': {
        light: { '--bg-primary': '#f5f0fa', '--bg-secondary': '#ffffff', '--bg-tertiary': '#ebe5f2', '--bg-card': '#ffffff', '--accent-primary': '#6b46c1', '--accent-secondary': '#ec4899', '--accent-tertiary': '#8b5cf6', '--accent-glow': 'rgba(107, 70, 193, 0.25)', '--text-primary': '#1a1033', '--text-secondary': '#4a3a5c', '--text-muted': '#8a7a9a', '--border-subtle': '#1a1033', '--border-glow': '#6b46c1', '--success': '#00c853', '--warning': '#ff9100', '--error': '#ff1744' },
        dark: { '--bg-primary': '#0f0a1a', '--bg-secondary': '#1a1033', '--bg-tertiary': '#251a44', '--bg-card': '#1a1033', '--accent-primary': '#a78bfa', '--accent-secondary': '#f472b6', '--accent-tertiary': '#c4b5fd', '--accent-glow': 'rgba(167, 139, 250, 0.35)', '--text-primary': '#f5f0fa', '--text-secondary': '#c4b5fd', '--text-muted': '#8a7a9a', '--border-subtle': '#a78bfa', '--border-glow': '#f472b6', '--success': '#00e676', '--warning': '#ffab40', '--error': '#ff5252' }
      },
      'amber-retro': {
        light: { '--bg-primary': '#f4f2ed', '--bg-secondary': '#ffffff', '--bg-tertiary': '#e8e4dc', '--bg-card': '#ffffff', '--accent-primary': '#1a1a1a', '--accent-secondary': '#ff8c00', '--accent-tertiary': '#ffaa33', '--accent-glow': 'rgba(255, 140, 0, 0.25)', '--text-primary': '#1a1a1a', '--text-secondary': '#4a4a4a', '--text-muted': '#8a8a8a', '--border-subtle': '#1a1a1a', '--border-glow': '#ff8c00', '--success': '#00c853', '--warning': '#ff9100', '--error': '#ff1744' },
        dark: { '--bg-primary': '#12100c', '--bg-secondary': '#1a1814', '--bg-tertiary': '#24201a', '--bg-card': '#1a1814', '--accent-primary': '#ff8c00', '--accent-secondary': '#ffaa33', '--accent-tertiary': '#ffcc66', '--accent-glow': 'rgba(255, 140, 0, 0.35)', '--text-primary': '#f4f2ed', '--text-secondary': '#d8d4cc', '--text-muted': '#8a8680', '--border-subtle': '#ff8c00', '--border-glow': '#ffaa33', '--success': '#00e676', '--warning': '#ffab40', '--error': '#ff5252' }
      }
    };
    const tokens = themeMap[colorTheme][theme];
    Object.keys(tokens).forEach(function (key) {
      document.documentElement.style.setProperty(key, tokens[key]);
    });
    const borderIntensity = typeof settings.borderIntensity === 'number' ? settings.borderIntensity : 1;
    const shadowIntensity = typeof settings.shadowIntensity === 'number' ? settings.shadowIntensity : 1;
    document.documentElement.style.setProperty('--border-weight', String(borderIntensity));
    document.documentElement.style.setProperty('--shadow-weight', String(shadowIntensity));
  } catch (e) {
    // Ignore storage access errors (e.g. private browsing).
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="darkreader-lock" />
        <script dangerouslySetInnerHTML={{ __html: LOCALE_HYDRATION_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_HYDRATION_SCRIPT }} />
      </head>
      <body>
        {/*
          Global layout layer (migrated from the old main.tsx GlobalLayout/PageLayout):
          Providers, Navigation, MusicPlayer, context menu, effects and first-screen
          loading are all mounted inside ClientEffects; children stays SSR-passed.
        */}
        <LanguageProvider>
          <SettingsProvider>
            <StylePresetProvider>
              <SearchProvider>
                <ClientEffects>{children}</ClientEffects>
                <GlobalSearch />
              </SearchProvider>
            </StylePresetProvider>
          </SettingsProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
