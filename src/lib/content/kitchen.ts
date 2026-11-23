/**
 * 菜谱内容管线
 *
 * 服务端专用：fs + gray-matter 解析 content/kitchen/*.md。
 * 仅在 Server Component / generateStaticParams / generateMetadata 中调用。
 */

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const KITCHEN_DIR = path.join(process.cwd(), 'content', 'kitchen');

export interface Recipe {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  /** 正文 Markdown，仅详情页需要 */
  content?: string;
  /** 步骤数（按 `### 1. xxx` 这类三级标题统计） */
  steps: number;
}

function normalizeDate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') return value.trim();
  return '';
}

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((t) => t.trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((t) => t.trim()).filter(Boolean);
  return [];
}

function countSteps(content: string): number {
  return (content.match(/^###\s+\d+\./gm) || []).length;
}

function readRecipe(file: string, withContent: boolean): Recipe | null {
  const full = path.join(KITCHEN_DIR, file);
  if (!fs.existsSync(full)) return null;
  const { data, content } = matter(fs.readFileSync(full, 'utf-8'));
  const slug = file.replace(/\.md$/, '');
  return {
    slug,
    title: typeof data.title === 'string' ? data.title : slug,
    description: typeof data.description === 'string' ? data.description : '',
    date: normalizeDate(data.date),
    tags: normalizeTags(data.tags),
    content: withContent ? content.trim() : undefined,
    steps: countSteps(content),
  };
}

let cachedList: Recipe[] | null = null;

/** 全部菜谱，日期倒序（同一日期按标题排序，保证构建稳定） */
export function getAllRecipes(): Recipe[] {
  if (cachedList) return cachedList;
  if (!fs.existsSync(KITCHEN_DIR)) {
    cachedList = [];
    return cachedList;
  }
  const recipes = fs
    .readdirSync(KITCHEN_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => readRecipe(f, false))
    .filter((r): r is Recipe => r !== null)
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.title.localeCompare(b.title, 'zh'));
  cachedList = recipes;
  return recipes;
}

export function getRecipeBySlug(slug: string): Recipe | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  return readRecipe(`${slug}.md`, true);
}

/** 标签汇总，用于列表页筛选 */
export function getAllRecipeTags(): Array<{ name: string; count: number }> {
  const map = new Map<string, number>();
  for (const recipe of getAllRecipes()) {
    for (const tag of recipe.tags) map.set(tag, (map.get(tag) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh'));
}
