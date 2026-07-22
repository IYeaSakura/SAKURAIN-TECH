import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import BlogPage from "@/components/blog/BlogPage";
import { getAllPosts, getAllTags } from "@/lib/content/blog";
import type { SiteData } from "@/types";

export const metadata: Metadata = {
  title: "博客 —— SAKURAIN",
  description: "技术博客：探索前端、可视化与创作。有用、有料、有趣。",
};

const BLOG_DESCRIPTION = "技术博客：探索前端、可视化与创作。有用、有料、有趣。";

/** 服务端读取站点公共数据（footer），避免客户端二次 fetch */
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
 * 博客列表 —— 真正 SSG。
 * 构建期通过内容管线解析 content/blog/posts/*.md，
 * 数据以 props 注入客户端展示组件（不再 fetch /blog/*.json）。
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
