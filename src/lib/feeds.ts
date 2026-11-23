/**
 * 服务端内容读取 + Feed/Sitemap 生成辅助（Phase 2 内建化）
 *
 * 自包含实现：直接用 fs + gray-matter 读取 content/blog/*.md，
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

/** RSS 收录配置：全局上限、内容源开关与每源条数（见 content/config/rss.json） */
const RSS_CONFIG_PATH = path.join(process.cwd(), "content", "config", "rss.json");

const BLOG_POSTS_DIR = path.join(process.cwd(), "content", "blog");
const KITCHEN_DIR = path.join(process.cwd(), "content", "kitchen");
const DOCS_INDEX_PATH = path.join(process.cwd(), "content", "docs-index.json");
const MOMENTS_JSON_PATH = path.join(process.cwd(), "public", "data", "moments.json");
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

/* ------------------------------------------------------------------ */
/* Feed 内容源配置                                                      */
/* ------------------------------------------------------------------ */

/** 收录进 RSS 的内容类型；新增类型时同步补 LOADERS 与字典 */
export type FeedSourceType = "blog" | "docs" | "moments" | "kitchen";

export const FEED_SOURCE_LABELS: Record<FeedSourceType, string> = {
  blog: "博客",
  docs: "文档",
  moments: "动态",
  kitchen: "菜谱",
};

export interface FeedSourceConfig {
  /** 关掉后该类型完全不进 feed */
  enabled?: boolean;
  /** 该类型最多收录几篇；缺省时只受全局 total 约束 */
  limit?: number;
}

export interface RssConfig {
  /** 全局最多收录多少篇 */
  total: number;
  /** 总量超限时的保留顺序 */
  priority: FeedSourceType[];
  sources: Partial<Record<FeedSourceType, FeedSourceConfig>>;
}

/** content/config/rss.json 缺失或字段残缺时的兜底：全部收录，按给定配额 */
export const DEFAULT_RSS_CONFIG: RssConfig = {
  total: 20,
  priority: ["blog", "docs", "moments", "kitchen"],
  sources: {
    blog: { enabled: true, limit: 10 },
    docs: { enabled: true, limit: 5 },
    moments: { enabled: true, limit: 3 },
    kitchen: { enabled: true, limit: 3 },
  },
};

/** 统一的 feed 条目，各内容源都归一化成这个结构 */
export interface FeedItem {
  id: string;
  type: FeedSourceType;
  typeLabel: string;
  title: string;
  /** 绝对地址 */
  url: string;
  date: string;
  description: string;
  tags: string[];
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
 * 读取全部博客文章（content/blog/*.md），按日期降序。
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
/* RSS 内容源                                                          */
/* ------------------------------------------------------------------ */

function isFeedSourceType(value: string): value is FeedSourceType {
  return value === "blog" || value === "docs" || value === "moments" || value === "kitchen";
}

/** 统一日期：`YYYY-MM-DD HH:mm:ss` 换成 `YYYY-MM-DDTHH:mm:ss`，避免解析歧义 */
function normalizeFeedDate(date: string): string {
  const trimmed = (date || "").trim();
  if (!trimmed) return "";
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(trimmed) ? trimmed.replace(" ", "T") : trimmed;
}

function truncateText(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

/** 读取 content/config/rss.json；缺失或字段残缺时按默认值兜底 */
export function getRssConfig(): RssConfig {
  const merged: RssConfig = {
    total: DEFAULT_RSS_CONFIG.total,
    priority: [...DEFAULT_RSS_CONFIG.priority],
    sources: { ...DEFAULT_RSS_CONFIG.sources },
  };

  try {
    const raw = JSON.parse(fs.readFileSync(RSS_CONFIG_PATH, "utf-8")) as Partial<RssConfig>;

    if (typeof raw.total === "number" && raw.total >= 0) {
      merged.total = raw.total;
    }
    if (Array.isArray(raw.priority)) {
      const priority = raw.priority.filter((type) => isFeedSourceType(type));
      if (priority.length) merged.priority = priority;
    }
    if (raw.sources && typeof raw.sources === "object") {
      for (const [type, conf] of Object.entries(raw.sources)) {
        if (!isFeedSourceType(type) || !conf || typeof conf !== "object") continue;
        merged.sources[type] = { ...merged.sources[type], ...conf };
      }
    }
  } catch {
    // 配置缺失时用默认值，构建不中断
  }

  return merged;
}

function toBlogFeedItems(): FeedItem[] {
  return getBlogPosts().map((post) => ({
    id: `blog:${post.slug}`,
    type: "blog",
    typeLabel: FEED_SOURCE_LABELS.blog,
    title: post.title,
    url: `${FEED_CONFIG.siteUrl}/blog/${post.slug}`,
    date: normalizeFeedDate(post.date),
    description: post.description,
    tags: post.tags,
    author: post.author,
  }));
}

interface DocsIndexItem {
  id: string;
  type: "series" | "doc";
  title?: string;
  description?: string;
  date?: string;
}

interface DocsIndexCategory {
  id: string;
  name?: string;
  items?: DocsIndexItem[];
}

function toDocFeedItems(): FeedItem[] {
  let docs: { categories?: DocsIndexCategory[] } | null = null;

  try {
    docs = JSON.parse(fs.readFileSync(DOCS_INDEX_PATH, "utf-8"));
  } catch {
    return [];
  }

  const items: FeedItem[] = [];

  for (const category of docs?.categories ?? []) {
    for (const item of category.items ?? []) {
      items.push({
        id: `docs:${category.id}/${item.id}`,
        type: "docs",
        typeLabel: FEED_SOURCE_LABELS.docs,
        title: item.title || item.id,
        url: `${FEED_CONFIG.siteUrl}/docs/${category.id}/${item.id}`,
        date: normalizeFeedDate(item.date ?? ""),
        description: item.description ?? "",
        tags: category.name ? [category.name] : [],
        author: "SAKURAIN",
      });
    }
  }

  return items.sort((a, b) => parseTime(b.date) - parseTime(a.date));
}

interface MomentEntryRaw {
  id?: string;
  date?: string;
  caption?: string | { zh?: string; en?: string };
}

function toMomentFeedItems(): FeedItem[] {
  let data: { entries?: MomentEntryRaw[] } | null = null;

  try {
    data = JSON.parse(fs.readFileSync(MOMENTS_JSON_PATH, "utf-8"));
  } catch {
    return [];
  }

  return (data?.entries ?? [])
    .map((entry, index) => {
      const caption =
        typeof entry.caption === "string"
          ? entry.caption
          : entry.caption?.zh || entry.caption?.en || "生活动态";

      return {
        id: `moment:${entry.id ?? index}`,
        type: "moments" as const,
        typeLabel: FEED_SOURCE_LABELS.moments,
        title: truncateText(caption, 40),
        url: `${FEED_CONFIG.siteUrl}/moments`,
        date: normalizeFeedDate(entry.date ?? ""),
        description: caption,
        tags: [FEED_SOURCE_LABELS.moments],
        author: "SAKURAIN",
      };
    })
    .sort((a, b) => parseTime(b.date) - parseTime(a.date));
}

function toKitchenFeedItems(): FeedItem[] {
  if (!fs.existsSync(KITCHEN_DIR)) return [];

  const items: FeedItem[] = [];

  for (const file of fs.readdirSync(KITCHEN_DIR).filter((name) => name.endsWith(".md"))) {
    const slug = file.replace(/\.md$/, "");
    try {
      const { data } = matter(fs.readFileSync(path.join(KITCHEN_DIR, file), "utf-8"));
      items.push({
        id: `kitchen:${slug}`,
        type: "kitchen",
        typeLabel: FEED_SOURCE_LABELS.kitchen,
        title: typeof data.title === "string" && data.title ? data.title : slug,
        url: `${FEED_CONFIG.siteUrl}/kitchen/${slug}`,
        date: normalizeFeedDate(data.date ? String(data.date) : ""),
        description: typeof data.description === "string" ? data.description : "",
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        author: "SAKURAIN",
      });
    } catch {
      // 单篇解析失败不影响整体
    }
  }

  return items.sort((a, b) => parseTime(b.date) - parseTime(a.date));
}

/** 内容源注册表：新增类型时在这里补一项，再往 rss.json 里加配置即可 */
const FEED_LOADERS: Record<FeedSourceType, () => FeedItem[]> = {
  blog: toBlogFeedItems,
  docs: toDocFeedItems,
  moments: toMomentFeedItems,
  kitchen: toKitchenFeedItems,
};

/**
 * 汇总 RSS 条目：先按类型截断（limit），再按 priority 顺序填到全局 total，
 * 最后按时间倒序输出。blog > docs > moments > 菜谱，超限时先丢低优先级的。
 */
export function getFeedItems(): FeedItem[] {
  const config = getRssConfig();

  const order: FeedSourceType[] = config.priority.filter(isFeedSourceType);
  for (const type of Object.keys(FEED_LOADERS) as FeedSourceType[]) {
    if (!order.includes(type)) order.push(type);
  }

  const picked: FeedItem[] = [];

  for (const type of order) {
    if (picked.length >= config.total) break;

    const source = config.sources[type];
    if (source?.enabled === false) continue;

    const limit = typeof source?.limit === "number" ? source.limit : config.total;
    if (limit <= 0) continue;

    picked.push(...FEED_LOADERS[type]().slice(0, limit));
  }

  return picked
    .slice(0, Math.max(config.total, 0))
    .sort((a, b) => parseTime(b.date) - parseTime(a.date));
}

/* ------------------------------------------------------------------ */
/* Feed 生成（格式对齐旧版 scripts/generate-feeds.js）                  */
/* ------------------------------------------------------------------ */

/** RSS 2.0 —— 博客 / 文档 / 动态 / 菜谱混排，靠 category 区分来源 */
export function generateRSS(items: FeedItem[], siteInfo: SiteInfo): string {
  const lastBuildDate =
    items.length > 0 && items[0].date
      ? new Date(items[0].date).toUTCString()
      : new Date().toUTCString();

  const entries = items
    .map((item) => {
      const pubDate = item.date ? new Date(item.date).toUTCString() : lastBuildDate;
      const categories = [
        `<category>${escapeXml(item.typeLabel)}</category>`,
        `<category>${escapeXml(item.type)}</category>`,
        ...item.tags
          .filter((tag) => tag !== item.typeLabel)
          .map((tag) => `<category>${escapeXml(tag)}</category>`),
      ].join("");

      return `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.url}</link>
      <guid isPermaLink="true">${item.url}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${siteInfo.author} (${escapeXml(item.author)})</author>
      <description>${escapeXml(item.description)}</description>
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
    ${entries}
  </channel>
</rss>`;
}

/** Atom 1.0 —— 每条带 category（term=类型标识，label=中文名）区分来源 */
export function generateAtom(items: FeedItem[], siteInfo: SiteInfo): string {
  const updated =
    items.length > 0 && items[0].date
      ? new Date(items[0].date).toISOString()
      : new Date().toISOString();

  const entries = items
    .map((item) => {
      const published = item.date ? new Date(item.date).toISOString() : updated;
      const categories = [
        `\n    <category term="${escapeXml(item.type)}" label="${escapeXml(item.typeLabel)}"/>`,
        ...item.tags
          .filter((tag) => tag !== item.typeLabel)
          .map((tag) => `\n    <category term="${escapeXml(tag)}"/>`),
      ].join("");

      return `
  <entry>
    <title>${escapeXml(item.title)}</title>
    <link href="${item.url}"/>
    <id>${item.url}</id>
    <published>${published}</published>
    <updated>${published}</updated>
    <author>
      <name>${escapeXml(item.author)}</name>
      <email>${siteInfo.author}</email>
    </author>
    <summary>${escapeXml(item.description)}</summary>${categories}
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

/** JSON Feed 1.1 —— tags 里带类型中文名，_sakurain 里带机器可读的类型 */
export function generateJSONFeed(items: FeedItem[], siteInfo: SiteInfo): string {
  const feedItems = items.map((item) => ({
    id: item.url,
    url: item.url,
    title: item.title,
    content_text: item.description,
    date_published: item.date ? new Date(item.date).toISOString() : undefined,
    author: {
      name: item.author,
    },
    tags: [item.typeLabel, ...item.tags.filter((tag) => tag !== item.typeLabel)],
    _sakurain: {
      type: item.type,
      type_label: item.typeLabel,
    },
  }));

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
    items: feedItems,
  };

  return JSON.stringify(feed, null, 2);
}
