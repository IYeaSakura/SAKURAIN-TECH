import type { Metadata } from "next";
import HomePageLoader from "@/components/HomePageLoader";
import { getAllNotes } from "@/lib/content/notes";
import { getAllPosts } from "@/lib/content/blog";

/**
 * Home page —— Server Component shell.
 * The actual content is the full-page client component migrated from the legacy
 * Vite project src/App.tsx (Phase 1 pragmatic bootstrap).
 * Recent posts and notes are injected at build time by the server content pipeline.
 */
export const metadata: Metadata = {
  title: "SAKURAIN — Personal Blog",
  description:
    "SAKURAIN's personal blog: game algorithms, quantitative systems, data analysis, and Web engineering.",
};

export default function Page() {
  const notes = getAllNotes();
  const posts = getAllPosts();
  return <HomePageLoader notes={notes} posts={posts} />;
}
