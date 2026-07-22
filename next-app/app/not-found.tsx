import type { Metadata } from "next";
import NotFoundLoader from "@/components/notfound/NotFoundLoader";

/**
 * 全局 404 页面 —— 迁移自旧 Vite 项目 src/pages/NotFound。
 * 全局导航与特效层由根布局 ClientEffects 提供，此处仅渲染 404 主体内容。
 */
export const metadata: Metadata = {
  title: "404 页面未找到 —— SAKURAIN",
  description: "页面不存在或已被移动。",
};

export default function NotFound() {
  return <NotFoundLoader />;
}
