import type { Metadata } from "next";
import BlogPageLoader from "@/components/blog/BlogPageLoader";

/**
 * 博客列表 —— Server Component 外壳。
 * 实际内容为迁移自旧 Vite 项目 src/pages/Blog/index.tsx 的整页客户端组件。
 */
export const metadata: Metadata = {
  title: "博客 —— SAKURAIN",
  description: "技术博客：探索前端、可视化与创作。有用、有料、有趣。",
};

export default function Page() {
  return <BlogPageLoader />;
}
