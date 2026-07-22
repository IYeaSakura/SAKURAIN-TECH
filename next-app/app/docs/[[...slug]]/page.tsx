import type { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import DocsPage from "@/components/docs/DocsPage";
import {
  getAllDocPaths,
  getDocChapter,
  getDocsTree,
} from "@/lib/content/docs";
import type { SiteData } from "@/types";

/**
 * 文档站 —— Phase 2 真 SSG。
 * optional catch-all 覆盖 /docs 及 /docs/:category/:item/:chapter 任意深度
 * （旧版四级参数语义，slug 数组 -> categoryId/itemId/chapterId 适配层在此保留）。
 * 目录树与章节 md 全部由服务端内容层（@/lib/content/docs）注入，
 * 客户端组件不再 fetch public JSON/md。
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllDocPaths();
}

interface PageParams {
  slug?: string[];
}

function resolveTitles(segments: string[]) {
  const tree = getDocsTree();
  const [categoryId, itemId, chapterId] = segments;
  if (!categoryId) {
    return { title: tree.title, description: tree.description };
  }
  const category = tree.categories.find((c) => c.id === categoryId);
  if (!category) return null;
  if (!itemId) {
    return {
      title: `${category.name} —— 文档`,
      description: tree.description,
    };
  }
  const item = category.items.find((i) => i.id === itemId);
  if (!item) return null;
  if (item.type === "series") {
    if (!chapterId) {
      return { title: `${item.title} —— ${category.name}`, description: item.description };
    }
    const chapter = item.chapters.find((c) => c.id === chapterId);
    if (!chapter) return null;
    return { title: `${chapter.title} —— ${item.title}`, description: chapter.description };
  }
  if (chapterId) return null;
  return { title: `${item.title} —— ${category.name}`, description: item.description };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolved = resolveTitles(slug ?? []);
  if (!resolved) {
    return { title: "文档 —— SAKURAIN" };
  }
  return {
    title: `${resolved.title} —— SAKURAIN`,
    description: resolved.description,
  };
}

/** 站点公共数据（页脚），构建期直读 JSON，避免客户端 fetch */
function getSiteData(): SiteData | null {
  try {
    const abs = path.join(process.cwd(), "public", "data", "site-data.json");
    return JSON.parse(fs.readFileSync(abs, "utf-8")) as SiteData;
  } catch {
    return null;
  }
}

export default async function Page({ params }: { params: Promise<PageParams> }) {
  const { slug } = await params;
  // 四级参数适配层：slug 数组 -> categoryId / itemId / chapterId
  const segments = slug ?? [];
  if (segments.length > 3) notFound();
  const [categoryId, itemId, chapterId] = segments;

  const tree = getDocsTree();
  const siteData = getSiteData();

  // 章节 / 单文档页：服务端读 md（gray-matter 已解析），注入客户端
  if (categoryId && itemId) {
    const data = getDocChapter(categoryId, itemId, chapterId);
    if (!data) notFound();
    return (
      <DocsPage
        config={tree}
        siteData={siteData}
        categoryId={categoryId}
        itemId={itemId}
        chapterId={chapterId}
        content={data.content}
      />
    );
  }

  // 首页 / 分类页：仅注入目录树
  if (categoryId) {
    const category = tree.categories.find((c) => c.id === categoryId);
    if (!category) notFound();
  }

  return (
    <DocsPage
      config={tree}
      siteData={siteData}
      categoryId={categoryId}
      itemId={itemId}
      chapterId={chapterId}
      content={null}
    />
  );
}
