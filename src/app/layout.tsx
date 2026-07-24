import type { Metadata } from "next";
import ClientEffects from "@/components/ClientEffects";
import { StylePresetProvider } from "@/contexts/StylePresetContext";
import "./globals.css";
import "./fonts/google-fonts.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sakurain.net"),
  title: "SAKURAIN",
  description: "SAKURAIN 个人品牌站 —— 有用、有料、有趣的技术创作者门户",
};

/**
 * Hydration script: restore the persisted style preset and color theme before
 * the first paint to prevent a flash of the default style.
 */
const THEME_HYDRATION_SCRIPT = `
(function () {
  try {
    const preset = localStorage.getItem('sakurain-style-preset') || 'default';
    if (preset === 'default' || preset === 'terminal') {
      document.documentElement.setAttribute('data-preset', preset);
    }
    const theme = localStorage.getItem('sakurain-theme') || 'light';
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.setAttribute('data-theme', theme);
    }
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
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_HYDRATION_SCRIPT }} />
      </head>
      <body>
        {/*
          全局布局层（迁移自旧版 main.tsx 的 GlobalLayout/PageLayout）：
          Provider、Navigation、MusicPlayer、右键菜单、特效、首屏 Loading
          均在 ClientEffects 内挂载，children 保持 SSR 传递。
        */}
        <StylePresetProvider>
          <ClientEffects>{children}</ClientEffects>
        </StylePresetProvider>
      </body>
    </html>
  );
}
