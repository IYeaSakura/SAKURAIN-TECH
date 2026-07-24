import type { Metadata } from "next";
import HomePageLoader from "@/components/HomePageLoader";
import { getAllNotes } from "@/lib/content/notes";
import { getAllPosts } from "@/lib/content/blog";

/**
 * 首页 —— Server Component 外壳。
 * 实际内容为迁移自旧 Vite 项目 src/App.tsx 的整页客户端组件（Phase 1 务实起步）。
 * 近期文章与说说数据由服务端内容管线在构建期读取并注入。
 */
export const metadata: Metadata = {
  title: "SAKURAIN —— 个人博客",
  description:
    "SAKURAIN 的个人博客：博弈算法、量化系统、数据分析与 Web 工程。",
};

export default function Page() {
  const notes = getAllNotes();
  const posts = getAllPosts();
  return <HomePageLoader notes={notes} posts={posts} />;
}
