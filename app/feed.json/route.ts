import { NextResponse } from "next/server";
import { FEED_POST_LIMIT, generateJSONFeed, getBlogPosts, getSiteInfo } from "@/lib/feeds";

export const dynamic = "force-static";

/** JSON Feed 1.1 —— https://sakurain.net/feed.json（最新 20 篇博客） */
export function GET() {
  const posts = getBlogPosts(FEED_POST_LIMIT);
  const siteInfo = getSiteInfo();

  return new NextResponse(generateJSONFeed(posts, siteInfo), {
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
    },
  });
}
