import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getCurrentUser,
  getMyPhotosWithResults,
  getRatingProgress,
  countRateablePhotos,
} from "@/lib/queries";
import { REVEAL_HOUR } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const [progress, photos, rateable] = await Promise.all([
    getRatingProgress(user.id),
    getMyPhotosWithResults(user.id),
    countRateablePhotos(user.id),
  ]);

  const main = photos.find((p) => p.slot === 0);
  const mainBatch = main?.latestBatch ?? null;
  const pct = Math.min((progress.given / progress.needed) * 100, 100);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-label-eyebrow">你好</p>
        <h1 className="text-2xl font-bold" style={{ color: "#2C2926" }}>
          {user.name ?? "朋友"}
        </h1>
      </div>

      {/* 我的定位摘要 */}
      <div className="card-surface flex flex-col gap-4 p-6">
        <p className="text-label-eyebrow">我的定位</p>
        {mainBatch ? (
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span
                  className="font-bold leading-none"
                  style={{ fontSize: "3rem", color: "#2C2926", letterSpacing: "-0.02em" }}
                >
                  {mainBatch.averageScore.toFixed(1)}
                </span>
                <span className="text-sm" style={{ color: "#9C8E7E" }}>
                  / 10
                </span>
              </div>
              <p className="mt-1 text-sm" style={{ color: "#7C7064" }}>
                贏過約 {mainBatch.percentileRank}% 的人 · {mainBatch.totalRatings} 人評分
              </p>
            </div>
            <Link
              href="/results"
              className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-white"
              style={{ background: "#C0396B" }}
            >
              看完整分眾
            </Link>
          </div>
        ) : photos.length > 0 ? (
          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold" style={{ color: "#2C2926" }}>
              結果準備中
            </p>
            <p className="text-sm" style={{ color: "#7C7064" }}>
              照片已進入評分池，每晚 {REVEAL_HOUR}:00 揭曉最新結果。
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm" style={{ color: "#7C7064" }}>
              還沒上傳照片。上傳一張正面照，開始累積你的分眾定位。
            </p>
            <Link
              href="/upload"
              className="rounded-2xl px-5 py-2.5 text-sm font-semibold text-white"
              style={{ background: "#C0396B" }}
            >
              上傳照片
            </Link>
          </div>
        )}
      </div>

      {/* 評分進度 */}
      <div className="card-surface flex flex-col gap-3 p-6">
        <div className="flex items-center justify-between">
          <p className="text-label-eyebrow">評分進度</p>
          <span className="text-xs" style={{ color: "#9C8E7E" }}>
            {Math.min(progress.given, progress.needed)}/{progress.needed}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "#EFE8DB" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: "#C0396B" }}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: "#7C7064" }}>
            {progress.unlocked
              ? "已解鎖查看資格"
              : `再評 ${progress.needed - progress.given} 人解鎖結果`}
            {rateable > 0 && ` · ${rateable} 人可評`}
          </p>
          <Link
            href="/rate"
            className="rounded-2xl px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "#C0396B" }}
          >
            去評分
          </Link>
        </div>
      </div>

      {/* 快速連結 */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/upload" className="card-surface flex flex-col gap-1 p-5">
          <span className="text-2xl" aria-hidden>
            📸
          </span>
          <span className="text-sm font-semibold" style={{ color: "#2C2926" }}>
            我的照片
          </span>
          <span className="text-xs" style={{ color: "#9C8E7E" }}>
            上傳對比照看成長
          </span>
        </Link>
        <Link href="/results" className="card-surface flex flex-col gap-1 p-5">
          <span className="text-2xl" aria-hidden>
            📊
          </span>
          <span className="text-sm font-semibold" style={{ color: "#2C2926" }}>
            我的結果
          </span>
          <span className="text-xs" style={{ color: "#9C8E7E" }}>
            分眾、百分位、前後對比
          </span>
        </Link>
      </div>
    </div>
  );
}
