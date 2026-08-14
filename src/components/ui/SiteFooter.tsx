import Link from "next/link";
import { SITE_NAME, CONTACT_EMAIL } from "@/lib/site";

// 全站頁尾：法律連結 + 版權。落地頁、登入頁、法律頁共用。
export function SiteFooter() {
  const year = 2025;
  return (
    <footer
      className="px-5 pb-8 pt-6 text-center"
      style={{ borderTop: "0.5px solid #EBE3D7" }}
    >
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
        <Link
          href="/privacy"
          className="underline-offset-2 hover:underline"
          style={{ color: "#7C7064" }}
        >
          隱私權政策
        </Link>
        <span style={{ color: "#D8CFC0" }}>·</span>
        <Link
          href="/terms"
          className="underline-offset-2 hover:underline"
          style={{ color: "#7C7064" }}
        >
          服務條款
        </Link>
        <span style={{ color: "#D8CFC0" }}>·</span>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="underline-offset-2 hover:underline"
          style={{ color: "#7C7064" }}
        >
          聯絡我們
        </a>
      </nav>
      <p className="mt-3 text-xs" style={{ color: "#B0A496" }}>
        © {year} {SITE_NAME} · 聚合分眾評分，保護你的隱私
      </p>
    </footer>
  );
}
