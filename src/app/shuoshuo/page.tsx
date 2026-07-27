import type { Metadata } from "next";
import { redirect } from "next/navigation";

/**
 * Legacy /shuoshuo redirects (301) to /dev-log to preserve external links
 * and search index compatibility after the rename to Dev Log.
 */
export const metadata: Metadata = {
  title: "Dev Log — SAKURAIN",
  description: "Development iterations and technical logs.",
};

export default function Page() {
  redirect("/dev-log");
}
