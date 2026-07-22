import { NextResponse } from "next/server";
import { FEED_POST_LIMIT, generateAtom, getBlogPosts, getSiteInfo } from "@/lib/feeds";

export const dynamic = "force-static";

/** Atom —— https://sakurain.net/atom.xml（最新 20 篇博客） */
export function GET() {
  const posts = getBlogPosts(FEED_POST_LIMIT);
  const siteInfo = getSiteInfo();

  return new NextResponse(generateAtom(posts, siteInfo), {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
    },
  });
}
