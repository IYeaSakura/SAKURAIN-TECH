import type { Metadata } from "next";
import FriendsPageLoader from "@/components/friends/FriendsPageLoader";

/**
 * Friends Links —— Server Component shell.
 * The actual content is the full-page client component migrated from the legacy
 * Vite project src/pages/Friends/index.tsx.
 */
export const metadata: Metadata = {
  title: "Friends Links — SAKURAIN",
  description: "Friend links: people related to me, link recommendations, and demo sites.",
};

export default function Page() {
  return <FriendsPageLoader />;
}
