import type { Metadata } from "next";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "幾分 — 真人互評 · 分眾定位 · 進步追蹤",
  description:
    "不只告訴你現在幾分，還陪你變得更高分。真人眼中的你，幾分？",
  keywords: ["顏值評分", "分眾分析", "前後對比", "成長追蹤"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
