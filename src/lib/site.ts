// 全站共用的品牌、網址與法律資訊。
// SEO metadata、sitemap/robots/manifest、OG 圖、法律頁面都從這裡取值，避免各處寫死不一致。

// 正式網址。部署時以環境變數 NEXT_PUBLIC_SITE_URL 覆寫（例：https://jifen.space）。
// 尾端斜線去掉，確保串接路徑時不會出現雙斜線。
const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jifen.space";
export const SITE_URL = rawSiteUrl.replace(/\/+$/, "");

export const SITE_NAME = "幾分";
export const SITE_TAGLINE = "真人互評 · 分眾定位 · 進步追蹤";

// 供 <title> 與社群分享用的完整敘述。
export const SITE_DESCRIPTION =
  "不只告訴你現在幾分，還陪你變得更高分。上傳照片、真人互評，看自己在不同性別、年齡、地區眼中的分眾定位與百分位，並追蹤前後對比的成長。";

// 法律 / 聯絡資訊
export const OPERATOR_NAME = "幾分團隊";
export const CONTACT_EMAIL = "k100306011@gmail.com";
// 法律頁面最後更新日（有實質條文更動時才更新）。
export const LEGAL_UPDATED_AT = "2026-07-06";

// 絕對網址小工具（OG 圖、JSON-LD 等需要完整 URL 時用）。
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
