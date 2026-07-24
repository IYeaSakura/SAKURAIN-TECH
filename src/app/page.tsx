import type { Metadata } from "next";
import HomePageLoader from "@/components/HomePageLoader";
import { getAllNotes } from "@/lib/content/notes";

/**
 * 首页 —— Server Component 外壳。
 * 实际内容为迁移自旧 Vite 项目 src/App.tsx 的整页客户端组件（Phase 1 务实起步）。
 * 近期说说数据由服务端内容管线在构建期读取并注入。
 */
export const metadata: Metadata = {
  title: "SAKURAIN —— 有用、有料、有趣",
  description:
    "SAKURAIN 的个人门户：技术博客、随记、文档与开源作品。有用、有料、有趣。",
};

export default function Page() {
  const notes = getAllNotes();
  return <HomePageLoader notes={notes} />;
}
