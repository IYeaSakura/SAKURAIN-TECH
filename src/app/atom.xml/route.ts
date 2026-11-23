import { NextResponse } from "next/server";
import { generateAtom, getFeedItems, getSiteInfo } from "@/lib/feeds";

export const dynamic = "force-static";

/** Atom —— https://sakurain.net/atom.xml（博客 / 文档 / 动态 / 菜谱混排） */
export function GET() {
  const items = getFeedItems();
  const siteInfo = getSiteInfo();

  return new NextResponse(generateAtom(items, siteInfo), {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
    },
  });
}
