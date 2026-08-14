import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION } from "@/lib/site";

// PWA manifest：讓「加入主畫面」有正確名稱、圖示與主題色。
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — ${SITE_TAGLINE}`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#FBF8F3",
    theme_color: "#FBF8F3",
    lang: "zh-TW",
    dir: "ltr",
    categories: ["lifestyle", "social", "photo"],
    icons: [
      {
        // app/icon.svg — 向量品牌符號，任意尺寸皆清晰。
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        // app/apple-icon.tsx 產生的圖示，用於安裝／主畫面。
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
