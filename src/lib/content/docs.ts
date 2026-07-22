/**
 * Docs 服务端内容管线（Phase 2）
 *
 * - 目录树来源：public/data/docs.json（与旧版路径约定保持一致，内容不迁移）
 * - 章节正文：按 chapter.path / doc.path 直接 fs 读取 public/docs 下的 md，
 *   经 gray-matter 解析（frontmatter + 正文）
 * - 仅供 Server Component / generateStaticParams / generateMetadata 使用，
 *   客户端组件一律通过 props 接收数据，不再 fetch
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type {
  Chapter,
  DocCategory,
  DocItem,
  DocSeries,
  DocsConfig,
  SingleDoc,
} from '@/components/docs/types';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const DOCS_JSON_PATH = path.join(PUBLIC_DIR, 'data', 'docs.json');

// ---------------------------------------------------------------------------
// 目录树
// ---------------------------------------------------------------------------

/** docs.json 原始结构中 icon/order 等字段可缺省，这里补齐默认值以满足类型 */
function normalizeConfig(raw: DocsConfig): DocsConfig {
  return {
    title: raw.title,
    description: raw.description,
    categories: raw.categories.map((category) => ({
      ...category,
      items: category.items.map((item) => {
        if (item.type === 'series') {
          const series = item as DocSeries;
          return {
            ...series,
            icon: series.icon ?? 'BookOpen',
            chapters: series.chapters.map((chapter, index) => ({
              ...chapter,
              order: chapter.order ?? index + 1,
            })),
          };
        }
        const doc = item as SingleDoc;
        return { ...doc, icon: doc.icon ?? 'FileText' };
      }),
    })),
  };
}

let cachedTree: DocsConfig | null = null;

/** 读取并规范化完整文档目录树（构建期调用，模块级缓存） */
export function getDocsTree(): DocsConfig {
  if (cachedTree) return cachedTree;
  const raw = JSON.parse(fs.readFileSync(DOCS_JSON_PATH, 'utf-8')) as DocsConfig;
  cachedTree = normalizeConfig(raw);
  return cachedTree;
}

// ---------------------------------------------------------------------------
// 章节内容
// ---------------------------------------------------------------------------

export interface DocChapterNav {
  id: string;
  title: string;
}

export interface DocChapterData {
  category: DocCategory;
  item: DocItem;
  /** 系列章节时为当前章节；单文档（type: 'doc'）时为 null */
  chapter: Chapter | null;
  /** gray-matter 解析后的 markdown 正文 */
  content: string;
  /** gray-matter 解析出的 frontmatter（无 frontmatter 时为空对象） */
  frontmatter: Record<string, unknown>;
  /** 同系列内相邻章节导航；单文档或无相邻章节时为 null */
  prev: DocChapterNav | null;
  next: DocChapterNav | null;
}

/** 将 docs.json 中的 "/docs/..." 公共路径安全映射到 public 下的绝对路径 */
function resolvePublicFile(publicPath: string): string | null {
  const rel = publicPath.replace(/^\/+/, '');
  const abs = path.resolve(PUBLIC_DIR, rel);
  if (!abs.startsWith(PUBLIC_DIR + path.sep) && abs !== PUBLIC_DIR) return null;
  return abs;
}

function readMarkdown(publicPath: string): {
  content: string;
  frontmatter: Record<string, unknown>;
} | null {
  const abs = resolvePublicFile(publicPath);
  if (!abs || !fs.existsSync(abs)) return null;
  const { content, data } = matter(fs.readFileSync(abs, 'utf-8'));
  return { content, frontmatter: data };
}

/**
 * 按四级参数语义取章节数据。
 * - 系列章节：getDocChapter(categoryId, itemId, chapterId)
 * - 单文档：  getDocChapter(categoryId, itemId)（chapterId 省略）
 * 任一环节不匹配或 md 缺失时返回 null（调用方转 notFound）。
 */
export function getDocChapter(
  categoryId: string,
  itemId: string,
  chapterId?: string,
): DocChapterData | null {
  const tree = getDocsTree();
  const category = tree.categories.find((c) => c.id === categoryId);
  if (!category) return null;
  const item = category.items.find((i) => i.id === itemId);
  if (!item) return null;

  if (item.type === 'series') {
    if (!chapterId) return null;
    const index = item.chapters.findIndex((c) => c.id === chapterId);
    if (index < 0) return null;
    const chapter = item.chapters[index];
    const md = readMarkdown(chapter.path);
    if (!md) return null;
    const prevChapter = index > 0 ? item.chapters[index - 1] : null;
    const nextChapter =
      index < item.chapters.length - 1 ? item.chapters[index + 1] : null;
    return {
      category,
      item,
      chapter,
      content: md.content,
      frontmatter: md.frontmatter,
      prev: prevChapter ? { id: prevChapter.id, title: prevChapter.title } : null,
      next: nextChapter ? { id: nextChapter.id, title: nextChapter.title } : null,
    };
  }

  // 单文档不接受 chapterId
  if (chapterId) return null;
  const md = readMarkdown(item.path);
  if (!md) return null;
  return {
    category,
    item,
    chapter: null,
    content: md.content,
    frontmatter: md.frontmatter,
    prev: null,
    next: null,
  };
}

// ---------------------------------------------------------------------------
// 静态参数
// ---------------------------------------------------------------------------

/**
 * generateStaticParams 用的全部合法 slug 组合：
 * []（文档首页）、[categoryId]、[categoryId, itemId]、
 * [categoryId, itemId, chapterId]（系列章节）
 *
 * 降级策略：docs.json 中引用了磁盘缺失 md 的章节不生成静态页
 * （配合 dynamicParams = false 访问时得到 404，与旧版 fetch 404 行为等价）。
 */
export function getAllDocPaths(): Array<{ slug: string[] }> {
  const tree = getDocsTree();
  const paths: Array<{ slug: string[] }> = [{ slug: [] }];
  for (const category of tree.categories) {
    paths.push({ slug: [category.id] });
    for (const item of category.items) {
      if (item.type === 'series') {
        paths.push({ slug: [category.id, item.id] });
        for (const chapter of item.chapters) {
          const abs = resolvePublicFile(chapter.path);
          if (abs && fs.existsSync(abs)) {
            paths.push({ slug: [category.id, item.id, chapter.id] });
          }
        }
      } else {
        const abs = resolvePublicFile(item.path);
        if (abs && fs.existsSync(abs)) {
          paths.push({ slug: [category.id, item.id] });
        }
      }
    }
  }
  return paths;
}
