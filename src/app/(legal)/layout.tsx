import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { SiteFooter } from "@/components/ui/SiteFooter";

// 法律頁共用外框：品牌返回列 + 內容容器 + 頁尾。公開可存取，不經登入守門。
export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #FBF8F3 0%, #F4EFE7 100%)" }}
    >
      <header className="flex items-center justify-between px-5 py-4 md:px-10">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={28} />
        </Link>
        <Link
          href="/"
          className="text-sm underline-offset-2 hover:underline"
          style={{ color: "#7C7064" }}
        >
          返回首頁
        </Link>
      </header>

      <main className="flex-1 px-5 pb-16 pt-4 md:px-10">
        <article className="legal-prose card-surface mx-auto w-full max-w-2xl p-6 md:p-10">
          {children}
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
