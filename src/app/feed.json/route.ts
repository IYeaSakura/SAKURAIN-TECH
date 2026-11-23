import { NextResponse } from "next/server";
import { generateJSONFeed, getFeedItems, getSiteInfo } from "@/lib/feeds";

export const dynamic = "force-static";

/** JSON Feed 1.1 —— https://sakurain.net/feed.json（博客 / 文档 / 动态 / 菜谱混排） */
export function GET() {
  const items = getFeedItems();
  const siteInfo = getSiteInfo();

  return new NextResponse(generateJSONFeed(items, siteInfo), {
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
    },
  });
}
