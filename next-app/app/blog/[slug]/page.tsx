import type { Metadata } from "next";
import BlogPostPageLoader from "@/components/blog/BlogPostPageLoader";

/**
 * 博客详情 —— Server Component 外壳。
 * 动态 generateMetadata（按文章 frontmatter 生成）留到 Phase 2。
 */
export const metadata: Metadata = {
  title: "博客文章 —— SAKURAIN",
  description: "SAKURAIN 技术博客文章详情。",
};

export default function Page() {
  return <BlogPostPageLoader />;
}
