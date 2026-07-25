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
 * Docs site —— Phase 2 true SSG.
 * Optional catch-all covers /docs and /docs/:category/:item/:chapter at any depth
 * (legacy four-level parameter semantics; slug array -> categoryId/itemId/chapterId
 * adapter kept here).
 * The table of contents and chapter markdown are fully injected by the server
 * content layer (@/lib/content/docs); the client component no longer fetches
 * public JSON/md.
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
      title: `${category.name} — Documentation`,
      description: tree.description,
    };
  }
  const item = category.items.find((i) => i.id === itemId);
  if (!item) return null;
  if (item.type === "series") {
    if (!chapterId) {
      return { title: `${item.title} — ${category.name}`, description: item.description };
    }
    const chapter = item.chapters.find((c) => c.id === chapterId);
    if (!chapter) return null;
    return { title: `${chapter.title} — ${item.title}`, description: chapter.description };
  }
  if (chapterId) return null;
  return { title: `${item.title} — ${category.name}`, description: item.description };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolved = resolveTitles(slug ?? []);
  if (!resolved) {
    return { title: "Documentation — SAKURAIN" };
  }
  return {
    title: `${resolved.title} — SAKURAIN`,
    description: resolved.description,
  };
}

/** Site-wide shared data (footer) read directly from JSON at build time to avoid client-side fetch */
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
  // Four-level parameter adapter: slug array -> categoryId / itemId / chapterId
  const segments = slug ?? [];
  if (segments.length > 3) notFound();
  const [categoryId, itemId, chapterId] = segments;

  const tree = getDocsTree();
  const siteData = getSiteData();

  // Chapter / single-doc page: server reads parsed md (gray-matter) and injects into client
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

  // Home / category page: inject only the table of contents
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
