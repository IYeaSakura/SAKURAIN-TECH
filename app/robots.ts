import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/feeds";

export const dynamic = "force-static";

/** robots.txt —— 允许全站，屏蔽 API/edge-functions，指向 sitemap */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/edge-functions/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
