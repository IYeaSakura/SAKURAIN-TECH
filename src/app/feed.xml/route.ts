import { NextResponse } from "next/server";
import { generateRSS, getFeedItems, getSiteInfo } from "@/lib/feeds";

export const dynamic = "force-static";

/** RSS 2.0 —— https://sakurain.net/feed.xml（博客 / 文档 / 动态 / 菜谱混排） */
export function GET() {
  const items = getFeedItems();
  const siteInfo = getSiteInfo();

  return new NextResponse(generateRSS(items, siteInfo), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
