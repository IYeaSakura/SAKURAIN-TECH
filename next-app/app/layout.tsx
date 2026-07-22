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
        {children}
        {/* 布局级客户端特效挂载点（占位，见 ClientEffects 注释） */}
        <ClientEffects />
      </body>
    </html>
  );
}
