import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/api/debug/", "/api/cache/"]
      }
    ],
    sitemap: `${getBaseUrl()}/sitemap.xml`
  };
}
