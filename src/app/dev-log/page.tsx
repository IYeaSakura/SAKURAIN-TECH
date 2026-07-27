import type { Metadata } from "next";
import { getAllNotes, getNotesArchive } from "@/lib/content/notes";
import NotesPage from "@/components/notes/NotesPage";

/**
 * Dev Log —— true SSG.
 * Reads content/notes/posts/*.md via the server content pipeline at build time
 * and injects data into the client presentation component as props, with no runtime fetch.
 */
export const metadata: Metadata = {
  title: "Dev Log — SAKURAIN",
  description: "Development iterations and technical logs.",
};

export default function Page() {
  const notes = getAllNotes();
  const archive = getNotesArchive();

  return <NotesPage notes={notes} months={archive.months} />;
}
