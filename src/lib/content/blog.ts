/**
 * 博客内容管线（Phase 2：内容层内聚）
 *
 * 服务端专用：通过 Node fs + gray-matter 直接解析 content/blog/*.md，
 * 取代旧版 public/blog/*.json 索引与客户端 fetch。
 *
 * 仅在 Server Component / generateStaticParams / generateMetadata /
 * route handler 等服务端上下文调用，切勿 import 进客户端组件。
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { BlogPost } from "@/components/blog/types";

/* ------------------------------------------------------------------ */
/* 常量                                                                */
/* ------------------------------------------------------------------ */

const BLOG_POSTS_DIR = path.join(process.cwd(), "content", "blog");

/** 中文阅读速度（字/分钟），与 src/components/blog/utils.ts 保持一致 */
const CHINESE_CHARS_PER_MINUTE = 400;

/* ------------------------------------------------------------------ */
/* 类型                                                                */
/* ------------------------------------------------------------------ */

export interface BlogTag {
  name: string;
  count: number;
}

/** 按月分组的归档单元，month 形如 "2026-02" */
export interface BlogArchiveMonth {
  month: string;
  posts: BlogPost[];
}

/* ------------------------------------------------------------------ */
/* frontmatter 归一化                                                  */
/* ------------------------------------------------------------------ */

/**
 * gray-matter（js-yaml）会把 `date: 2026-02-21` 解析成 Date 对象，
 * 这里统一回 "YYYY-MM-DD" 字符串；非法输入原样返回。
 */
function normalizeDate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string") return value.trim();
  return "";
}

/** 兼容两种 tags 写法：YAML 数组 或 逗号分隔字符串 */
function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((t) => t.trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

/** 统计字数：中文字符 + 英文单词 */
function countWords(content: string): number {
  const chineseChars = (content.match(/[一-龥]/g) || []).length;
  const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars + englishWords;
}

function readingTime(content: string): string {
  const chineseChars = (content.match(/[一-龥]/g) || []).length;
  const minutes = Math.max(1, Math.ceil(chineseChars / CHINESE_CHARS_PER_MINUTE));
  return `${minutes} 分钟阅读`;
}

function parseTime(date: string): number {
  const t = new Date(date).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/* ------------------------------------------------------------------ */
/* 解析                                                                */
/* ------------------------------------------------------------------ */

interface ParsedPost {
  meta: BlogPost;
  content: string;
}

function parsePostFile(file: string): ParsedPost | null {
  try {
    const raw = fs.readFileSync(path.join(BLOG_POSTS_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    const slug = file.replace(/\.mdx?$/, "");
    const words = countWords(content);

    const meta: BlogPost = {
      slug,
      title: typeof data.title === "string" && data.title ? data.title : slug,
      description:
        typeof data.description === "string"
          ? data.description
          : typeof data.excerpt === "string"
            ? data.excerpt
            : "",
      date: normalizeDate(data.date),
      author: typeof data.author === "string" && data.author ? data.author : "SAKURAIN",
      tags: normalizeTags(data.tags),
      cover: typeof data.cover === "string" ? data.cover : "",
      featured: data.featured === true || data.featured === "true",
      wordCount: words,
      readingTime: readingTime(content),
    };

    return { meta, content };
  } catch {
    // 单篇解析失败不影响整体
    return null;
  }
}

function readAllPosts(): ParsedPost[] {
  if (!fs.existsSync(BLOG_POSTS_DIR)) return [];

  const files = fs
    .readdirSync(BLOG_POSTS_DIR)
    .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"));

  return files
    .map(parsePostFile)
    .filter((p): p is ParsedPost => p !== null)
    .sort((a, b) => parseTime(b.meta.date) - parseTime(a.meta.date));
}

/* ------------------------------------------------------------------ */
/* 公开 API                                                            */
/* ------------------------------------------------------------------ */

/**
 * 全部文章列表（按日期倒序），含 frontmatter / slug / 阅读时间 / 字数，
 * 不含正文 content（避免列表页 RSC 负载过大）。
 */
export function getAllPosts(): BlogPost[] {
  return readAllPosts().map((p) => p.meta);
}

/** 按 slug 获取单篇文章（含正文 content）；不存在时返回 null */
export function getPostBySlug(slug: string): BlogPost | null {
  const file = `${slug}.md`;
  const parsed =
    parsePostFile(file) ??
    (fs.existsSync(path.join(BLOG_POSTS_DIR, `${slug}.mdx`))
      ? parsePostFile(`${slug}.mdx`)
      : null);
  if (!parsed) return null;
  return { ...parsed.meta, content: parsed.content };
}

/** 全部标签（按文章数降序，同名按字典序） */
export function getAllTags(): BlogTag[] {
  const counter = new Map<string, number>();
  for (const post of getAllPosts()) {
    for (const tag of post.tags) {
      counter.set(tag, (counter.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counter.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));
}

/** 按月分组归档（月份倒序，组内按日期倒序） */
export function getArchive(): BlogArchiveMonth[] {
  const groups = new Map<string, BlogPost[]>();
  for (const post of getAllPosts()) {
    const month = post.date.slice(0, 7); // YYYY-MM
    if (!month) continue;
    const list = groups.get(month);
    if (list) list.push(post);
    else groups.set(month, [post]);
  }
  return Array.from(groups.entries())
    .map(([month, posts]) => ({ month, posts }))
    .sort((a, b) => (a.month < b.month ? 1 : -1));
}
