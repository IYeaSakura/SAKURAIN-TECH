import type { Metadata } from "next";
import { getAllNotes, getNotesArchive } from "@/lib/content/notes";
import NotesPage from "@/components/notes/NotesPage";

/**
 * 说说 —— 真正 SSG。
 * 构建期由服务端内容管线读取 content/notes/posts/*.md，
 * 数据以 props 注入客户端展示组件，无运行时 fetch。
 */
export const metadata: Metadata = {
  title: "说说 —— SAKURAIN",
  description: "记录日常灵感、心情与碎碎念。",
};

export default function Page() {
  const notes = getAllNotes();
  const archive = getNotesArchive();

  return <NotesPage notes={notes} months={archive.months} />;
}
