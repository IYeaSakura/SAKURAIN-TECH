import type { Metadata } from "next";
import DocsPageLoader from "@/components/docs/DocsPageLoader";

/**
 * 文档站 —— Server Component 外壳。
 * optional catch-all：覆盖 /docs 及 /docs/a/b/c 任意深度（旧版四级参数路由，
 * 客户端组件内已做 slug 数组 -> categoryId/itemId/chapterId 适配）。
 * 动态 generateMetadata 留到 Phase 2。
 */
export const metadata: Metadata = {
  title: "文档 —— SAKURAIN",
  description: "知识库与技术文档：系列教程、专题文档与学习笔记。",
};

export default function Page() {
  return <DocsPageLoader />;
}
