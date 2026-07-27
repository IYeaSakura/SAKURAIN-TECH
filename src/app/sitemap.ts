import type { MetadataRoute } from "next";
import { SITE_URL, formatDate, getBlogPosts, getDocPagePaths } from "@/lib/feeds";

export const dynamic = "force-static";

/**
 * 全站 sitemap（构建期静态生成）
 * 对齐旧版 scripts/generate-sitemap.js 的 URL 结构，保持外链兼容：
 *   静态路由 + /blog/<slug> + /docs/<cat>[/<item>[/<chapter>]]
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const today = formatDate(new Date());

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: today, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/blog`, lastModified: today, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/docs`, lastModified: today, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/dev-log`, lastModified: today, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/friends`, lastModified: today, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/friends-circle`, lastModified: today, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/about`, lastModified: today, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/resume`, lastModified: today, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/projects`, lastModified: today, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/earth-online`, lastModified: today, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/algo-viz`, lastModified: today, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/moments`, lastModified: today, changeFrequency: "weekly", priority: 0.6 },
  ];

  // 博客文章：lastmod 取 frontmatter date
  const blogPosts: MetadataRoute.Sitemap = getBlogPosts().map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: formatDate(post.date),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // Docs 章节：由 public/data/docs.json 推导
  const docPages: MetadataRoute.Sitemap = getDocPagePaths().map((p) => {
    const depth = p.split("/").filter(Boolean).length; // /docs/x=2, /docs/x/y=3, /docs/x/y/z=4
    return {
      url: `${SITE_URL}${p}`,
      lastModified: today,
      changeFrequency: depth >= 4 ? "monthly" : "weekly",
      priority: depth === 2 ? 0.7 : depth === 3 ? 0.6 : 0.5,
    };
  });

  return [...staticPages, ...blogPosts, ...docPages];
}
