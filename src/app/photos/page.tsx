import type { Metadata } from "next";
import { redirect } from "next/navigation";

/**
 * Legacy /photos redirects (301) to /moments to preserve external links
 * and search index compatibility after the rename to Moments.
 */
export const metadata: Metadata = {
  title: "Moments | SAKURAIN",
  description: "Life moments and snapshots.",
};

export default function Page() {
  redirect("/moments");
}
