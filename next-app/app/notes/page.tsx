import type { Metadata } from "next";
import NotesPageLoader from "@/components/notes/NotesPageLoader";

/**
 * 随记 —— Server Component 外壳。
 * 实际内容为迁移自旧 Vite 项目 src/pages/Notes/index.tsx 的整页客户端组件。
 */
export const metadata: Metadata = {
  title: "随记 —— SAKURAIN",
  description: "记录日常灵感、心情与碎碎念。",
};

export default function Page() {
  return <NotesPageLoader />;
}
