import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma 7 + Turbopack 必要設定：讓這些套件在 runtime 從 node_modules 載入，
  // 不要被打包，避免 "Cannot find module '.prisma/client/default'"。
  serverExternalPackages: [
    "@prisma/client",
    ".prisma/client",
    "@prisma/adapter-better-sqlite3",
    "better-sqlite3",
  ],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  // 移除洩漏框架版本的 X-Powered-By 標頭。
  poweredByHeader: false,

  // 全站安全性 HTTP 標頭（不影響功能，屬上線基本防護）。
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // 強制瀏覽器後續一律走 HTTPS（僅在 https 下生效，http 下無害）。
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          // 禁止瀏覽器 MIME 型別嗅探。
          { key: "X-Content-Type-Options", value: "nosniff" },
          // 防止被他站以 iframe 內嵌（點擊劫持）。
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // 跨站時只送出來源網域，不洩漏完整路徑。
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // 本服務用不到這些裝置權限，一律關閉。
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
