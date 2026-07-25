import type { Metadata } from "next";
import FeedPageLoader from "@/components/feed/FeedPageLoader";

/**
 * Friends Circle —— Server Component shell.
 * The actual content is the full-page client component migrated from the legacy
 * Vite project src/pages/Feed/index.tsx.
 * Note: /api/feed/* endpoints have not been migrated yet; the component shows
 * a fallback error state when the API returns 404.
 */
export const metadata: Metadata = {
  title: "Friends Circle — SAKURAIN",
  description: "Aggregate the latest articles from friend-linked sites, synced in real time for a one-stop reading experience.",
};

export default function Page() {
  return <FeedPageLoader />;
}
