import type { Metadata } from "next";
import ClientEffects from "@/components/ClientEffects";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAKURAIN",
  description: "SAKURAIN 个人品牌站 —— 有用、有料、有趣的技术创作者门户",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        {/*
          全局布局层（迁移自旧版 main.tsx 的 GlobalLayout/PageLayout）：
          Provider、Navigation、MusicPlayer、右键菜单、特效、首屏 Loading
          均在 ClientEffects 内挂载，children 保持 SSR 传递。
        */}
        <ClientEffects>{children}</ClientEffects>
      </body>
    </html>
  );
}
