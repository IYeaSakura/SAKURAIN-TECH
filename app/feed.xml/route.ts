import { NextResponse } from "next/server";
import { FEED_POST_LIMIT, generateRSS, getBlogPosts, getSiteInfo } from "@/lib/feeds";

export const dynamic = "force-static";

/** RSS 2.0 —— https://sakurain.net/feed.xml（最新 20 篇博客） */
export function GET() {
  const posts = getBlogPosts(FEED_POST_LIMIT);
  const siteInfo = getSiteInfo();

  return new NextResponse(generateRSS(posts, siteInfo), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
