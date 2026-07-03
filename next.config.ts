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
};

export default nextConfig;
