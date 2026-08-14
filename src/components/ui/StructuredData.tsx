import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  CONTACT_EMAIL,
  absoluteUrl,
} from "@/lib/site";

// schema.org 結構化資料（JSON-LD），讓 Google 更懂這個站是什麼。
export function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "zh-TW",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl("/apple-icon"),
        email: CONTACT_EMAIL,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify 的輸出僅含資料值，無使用者輸入，注入安全。
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
