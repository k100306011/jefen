import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// 允許索引公開頁；擋掉登入後才有意義、且含個人內容的路徑與 API。
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/rate",
        "/results",
        "/upload",
        "/settings",
        "/onboarding",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
