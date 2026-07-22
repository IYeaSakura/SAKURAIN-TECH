/**
 * 服务端内容读取 + Feed/Sitemap 生成辅助（Phase 2 内建化）
 *
 * 自包含实现：直接用 fs + gray-matter 读取 next-app/content/blog/posts/*.md，
 * 不依赖 src/lib/content/（由其他任务并行建设中）。
 * 输出格式对齐旧版 scripts/generate-feeds.js / generate-sitemap.js，保持 URL 兼容。
 *
 * 仅在服务端（sitemap.ts / route handlers，Node.js runtime，构建期执行）使用。
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

/* ------------------------------------------------------------------ */
/* 常量                                                                */
/* ------------------------------------------------------------------ */

export const SITE_URL = "https://sakurain.net";

export const FEED_CONFIG = {
  title: "SAKURAIN TEAM",
  description: "用代码构建世界",
  siteUrl: SITE_URL,
  feedUrl: `${SITE_URL}/feed.xml`,
  atomUrl: `${SITE_URL}/atom.xml`,
  jsonFeedUrl: `${SITE_URL}/feed.json`,
  author: {
    name: "SAKURAIN",
    email: "Yae_SakuRain@outlook.com",
  },
  language: "zh-CN",
  copyright: "© 2026 SAKURAIN 技术工作室",
} as const;

/** Feed 收录的最新文章数 */
export const FEED_POST_LIMIT = 20;

const BLOG_POSTS_DIR = path.join(process.cwd(), "content", "blog", "posts");
const SITE_DATA_PATH = path.join(process.cwd(), "public", "data", "site-data.json");
const DOCS_JSON_PATH = path.join(process.cwd(), "public", "data", "docs.json");

/* ------------------------------------------------------------------ */
/* 类型                                                                */
/* ------------------------------------------------------------------ */

export interface FeedPost {
  slug: string;
  title: string;
  date: string; // frontmatter date，原样保留（YYYY-MM-DD 或 ISO）
  description: string;
  tags: string[];
  author: string;
}

export interface SiteInfo {
  title: string;
  description: string;
  /** 站长邮箱（用于 feed author 字段） */
  author: string;
}

interface DocChapter {
  id: string;
}

interface DocItem {
  id: string;
  chapters?: DocChapter[];
}

interface DocCategory {
  id: string;
  items?: DocItem[];
}

/* ------------------------------------------------------------------ */
/* 工具                                                                */
/* ------------------------------------------------------------------ */

/** XML 特殊字符转义（与旧版 generate-feeds.js 一致） */
export function escapeXml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** 解析日期；非法输入回退到 epoch，保证排序稳定 */
function parseTime(date: string): number {
  const t = new Date(date).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** ISO 日期（YYYY-MM-DD），供 sitemap lastmod 使用 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
  return d.toISOString().split("T")[0];
}

/* ------------------------------------------------------------------ */
/* 数据加载                                                            */
/* ------------------------------------------------------------------ */

/** 读取站点元数据（title / description / contact.email），缺失时回退默认 */
export function getSiteInfo(): SiteInfo {
  try {
    const raw = fs.readFileSync(SITE_DATA_PATH, "utf-8");
    const siteData = JSON.parse(raw);
    return {
      title: siteData.meta?.title || FEED_CONFIG.title,
      description: siteData.meta?.description || FEED_CONFIG.description,
      author: siteData.contact?.email || FEED_CONFIG.author.email,
    };
  } catch {
    return {
      title: FEED_CONFIG.title,
      description: FEED_CONFIG.description,
      author: FEED_CONFIG.author.email,
    };
  }
}

/**
 * 读取全部博客文章（content/blog/posts/*.md），按日期降序。
 * 目录不存在（内容迁移进行中）时返回空数组，保证构建不中断。
 */
export function getBlogPosts(limit?: number): FeedPost[] {
  if (!fs.existsSync(BLOG_POSTS_DIR)) {
    return [];
  }

  const files = fs
    .readdirSync(BLOG_POSTS_DIR)
    .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"));

  const posts: FeedPost[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(BLOG_POSTS_DIR, file), "utf-8");
      const { data } = matter(raw);
      const fallbackSlug = file.replace(/\.mdx?$/, "");

      posts.push({
        slug: typeof data.slug === "string" && data.slug ? data.slug : fallbackSlug,
        title: typeof data.title === "string" && data.title ? data.title : fallbackSlug,
        date: data.date ? String(data.date) : "",
        description:
          typeof data.description === "string"
            ? data.description
            : typeof data.excerpt === "string"
              ? data.excerpt
              : "",
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        author: typeof data.author === "string" && data.author ? data.author : "SAKURAIN",
      });
    } catch {
      // 单篇文章解析失败不影响整体
    }
  }

  posts.sort((a, b) => parseTime(b.date) - parseTime(a.date));
  return typeof limit === "number" ? posts.slice(0, limit) : posts;
}

/**
 * 从 public/data/docs.json 推导 docs 章节 URL 路径（与旧版一致）：
 *   /docs/<categoryId>
 *   /docs/<categoryId>/<itemId>
 *   /docs/<categoryId>/<itemId>/<chapterId>
 */
export function getDocPagePaths(): string[] {
  const paths: string[] = [];

  try {
    const raw = fs.readFileSync(DOCS_JSON_PATH, "utf-8");
    const docs = JSON.parse(raw);

    for (const category of (docs.categories || []) as DocCategory[]) {
      paths.push(`/docs/${category.id}`);

      for (const item of category.items || []) {
        paths.push(`/docs/${category.id}/${item.id}`);

        for (const chapter of item.chapters || []) {
          paths.push(`/docs/${category.id}/${item.id}/${chapter.id}`);
        }
      }
    }
  } catch {
    // docs.json 缺失或损坏时跳过 docs URL
  }

  return paths;
}

/* ------------------------------------------------------------------ */
/* Feed 生成（格式对齐旧版 scripts/generate-feeds.js）                  */
/* ------------------------------------------------------------------ */

/** RSS 2.0 */
export function generateRSS(posts: FeedPost[], siteInfo: SiteInfo): string {
  const lastBuildDate =
    posts.length > 0 ? new Date(posts[0].date).toUTCString() : new Date().toUTCString();

  const items = posts
    .map((post) => {
      const pubDate = new Date(post.date).toUTCString();
      const link = `${FEED_CONFIG.siteUrl}/blog/${post.slug}`;
      const categories =
        post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join("") || "";

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${siteInfo.author} (${escapeXml(post.author)})</author>
      <description>${escapeXml(post.description)}</description>
      ${categories}
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteInfo.title)}</title>
    <link>${FEED_CONFIG.siteUrl}</link>
    <description>${escapeXml(siteInfo.description)}</description>
    <language>${FEED_CONFIG.language}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <copyright>${FEED_CONFIG.copyright}</copyright>
    <generator>SAKURAIN Feed Generator</generator>
    <atom:link href="${FEED_CONFIG.feedUrl}" rel="self" type="application/rss+xml"/>
    <atom:link href="${FEED_CONFIG.atomUrl}" rel="alternate" type="application/atom+xml"/>
    ${items}
  </channel>
</rss>`;
}

/** Atom 1.0 */
export function generateAtom(posts: FeedPost[], siteInfo: SiteInfo): string {
  const updated =
    posts.length > 0 ? new Date(posts[0].date).toISOString() : new Date().toISOString();

  const entries = posts
    .map((post) => {
      const published = new Date(post.date).toISOString();
      const link = `${FEED_CONFIG.siteUrl}/blog/${post.slug}`;
      const categories =
        post.tags.map((tag) => `\n    <category term="${escapeXml(tag)}"/>`).join("") || "";

      return `
  <entry>
    <title>${escapeXml(post.title)}</title>
    <link href="${link}"/>
    <id>${link}</id>
    <published>${published}</published>
    <updated>${published}</updated>
    <author>
      <name>${escapeXml(post.author)}</name>
      <email>${siteInfo.author}</email>
    </author>
    <summary>${escapeXml(post.description)}</summary>${categories}
  </entry>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(siteInfo.title)}</title>
  <subtitle>${escapeXml(siteInfo.description)}</subtitle>
  <link href="${FEED_CONFIG.atomUrl}" rel="self" type="application/atom+xml"/>
  <link href="${FEED_CONFIG.siteUrl}" rel="alternate" type="text/html"/>
  <updated>${updated}</updated>
  <id>${FEED_CONFIG.siteUrl}/</id>
  <author>
    <name>SAKURAIN</name>
    <email>${siteInfo.author}</email>
  </author>
  <rights>${FEED_CONFIG.copyright}</rights>${entries}
</feed>`;
}

/** JSON Feed 1.1 */
export function generateJSONFeed(posts: FeedPost[], siteInfo: SiteInfo): string {
  const items = posts.map((post) => {
    const link = `${FEED_CONFIG.siteUrl}/blog/${post.slug}`;
    return {
      id: link,
      url: link,
      title: post.title,
      content_text: post.description,
      date_published: new Date(post.date).toISOString(),
      author: {
        name: post.author,
      },
      tags: post.tags,
    };
  });

  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: siteInfo.title,
    description: siteInfo.description,
    home_page_url: FEED_CONFIG.siteUrl,
    feed_url: FEED_CONFIG.jsonFeedUrl,
    language: FEED_CONFIG.language,
    authors: [
      {
        name: "SAKURAIN",
        url: FEED_CONFIG.siteUrl,
      },
    ],
    items,
  };

  return JSON.stringify(feed, null, 2);
}
