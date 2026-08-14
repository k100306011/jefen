"use client";

// 頁面層級的錯誤邊界：執行期發生未預期錯誤時，顯示友善畫面而非原始堆疊。
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 text-center"
      style={{ background: "linear-gradient(160deg, #FBF8F3 0%, #F4EFE7 100%)" }}
    >
      <h1 className="text-xl font-bold" style={{ color: "#2C2926" }}>
        出了點狀況
      </h1>
      <p className="mt-2 text-sm" style={{ color: "#7C7064" }}>
        頁面暫時無法載入，請稍後再試一次。
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-full px-6 py-2.5 text-sm font-semibold"
        style={{ background: "#C0396B", color: "#fff" }}
      >
        重新載入
      </button>
    </div>
  );
}
