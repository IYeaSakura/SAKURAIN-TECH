import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import BlogPage from "@/components/blog/BlogPage";
import { getAllPosts, getAllTags } from "@/lib/content/blog";
import type { SiteData } from "@/types";

export const metadata: Metadata = {
  title: "Blog — SAKURAIN",
  description: "Tech blog: exploring frontend, visualization, and creation. Useful, substantial, and fun.",
};

const BLOG_DESCRIPTION = "Tech blog: exploring frontend, visualization, and creation. Useful, substantial, and fun.";

/** Server-side read of site-wide shared data (footer) to avoid a second client-side fetch */
function getFooterData(): SiteData["footer"] | null {
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), "public", "data", "site-data.json"),
      "utf-8"
    );
    return (JSON.parse(raw) as SiteData).footer ?? null;
  } catch {
    return null;
  }
}

/**
 * Blog list —— true SSG.
 * Parses content/blog/*.md via the content pipeline at build time and
 * injects data into the client presentation component as props (no fetch /blog/*.json).
 */
export default function Page() {
  const posts = getAllPosts();
  const tags = getAllTags();
  const footer = getFooterData();

  return (
    <BlogPage
      posts={posts}
      tags={tags}
      description={BLOG_DESCRIPTION}
      footer={footer}
    />
  );
}
