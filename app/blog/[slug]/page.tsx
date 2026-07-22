import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPostPage from "@/components/blog/BlogPostPage";
import { getAllPosts, getPostBySlug } from "@/lib/content/blog";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** 全部文章 slug 构建期静态生成 */
export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

/** 仅生成静态参数覆盖的 slug，其余 404 */
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return { title: "文章不存在 —— SAKURAIN" };
  }

  return {
    title: `${post.title} —— SAKURAIN`,
    description: post.description,
    keywords: post.tags,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
      images: post.cover ? [post.cover] : undefined,
    },
  };
}

/**
 * 博客详情 —— 真正 SSG。
 * 服务端读取 md 原文，以 props 传给客户端渲染组件（不再 fetch .md）。
 */
export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // 列表数据用于上一篇/下一篇与相关文章（不含正文）
  const allPosts = getAllPosts();

  return <BlogPostPage post={post} allPosts={allPosts} />;
}
