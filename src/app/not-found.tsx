import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 text-center"
      style={{ background: "linear-gradient(160deg, #FBF8F3 0%, #F4EFE7 100%)" }}
    >
      <p
        className="text-6xl font-bold"
        style={{ color: "#C0396B", letterSpacing: "-0.03em" }}
      >
        404
      </p>
      <h1 className="mt-4 text-xl font-bold" style={{ color: "#2C2926" }}>
        找不到這個頁面
      </h1>
      <p className="mt-2 text-sm" style={{ color: "#7C7064" }}>
        你要找的內容可能已移除或網址有誤。
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full px-6 py-2.5 text-sm font-semibold"
        style={{ background: "#C0396B", color: "#fff" }}
      >
        回首頁
      </Link>
    </div>
  );
}
