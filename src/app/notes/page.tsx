import type { Metadata } from "next";
import { redirect } from "next/navigation";

/**
 * Dev notes have been refactored into "Shuoshuo"; the legacy /notes path
 * redirects (301) to /shuoshuo to preserve external links and search index compatibility.
 */
export const metadata: Metadata = {
  title: "Shuoshuo — SAKURAIN",
  description: "Daily inspirations, moods, and casual thoughts.",
};

export default function Page() {
  redirect("/shuoshuo");
}
