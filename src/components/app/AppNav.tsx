"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "首頁" },
  { href: "/rate", label: "評分" },
  { href: "/results", label: "我的結果" },
  { href: "/upload", label: "照片" },
];

export function AppNav({ name }: { name?: string | null }) {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-20 backdrop-blur"
      style={{
        background: "rgba(251,248,243,0.85)",
        borderBottom: "0.5px solid #EBE3D7",
      }}
    >
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-3">
        <Link
          href="/dashboard"
          className="text-lg font-bold tracking-tight"
          style={{ color: "#2C2926" }}
        >
          幾分
        </Link>

        <nav className="flex items-center gap-1">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
                style={{
                  color: active ? "#fff" : "#7C7064",
                  background: active ? "#C0396B" : "transparent",
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/settings"
          aria-label="設定"
          title={name ?? "設定"}
          className="rounded-full px-2.5 py-1.5 text-sm"
          style={{
            color: pathname === "/settings" ? "#fff" : "#9C8E7E",
            background: pathname === "/settings" ? "#C0396B" : "transparent",
          }}
        >
          ⚙
        </Link>
      </div>
    </header>
  );
}
