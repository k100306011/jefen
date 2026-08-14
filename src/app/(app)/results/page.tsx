import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getCurrentUser,
  getMyPhotosWithResults,
  getRatingProgress,
  getResultHistory,
} from "@/lib/queries";
import { ResultCard } from "@/components/app/ResultCard";
import { TrendChart } from "@/components/app/TrendChart";
import { round1 } from "@/lib/scoring";
import { REVEAL_HOUR } from "@/lib/constants";

export const dynamic = "force-dynamic";

function EmptyState({
  title,
  desc,
  href,
  cta,
}: {
  title: string;
  desc: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="card-surface flex flex-col items-center gap-4 p-8 text-center">
      <h2 className="text-xl font-bold" style={{ color: "#2C2926" }}>
        {title}
      </h2>
      <p className="text-sm" style={{ color: "#7C7064" }}>
        {desc}
      </p>
      <Link
        href={href}
        className="rounded-2xl px-6 py-3 text-sm font-semibold text-white"
        style={{ background: "#C0396B" }}
      >
        {cta}
      </Link>
    </div>
  );
}

export default async function ResultsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const [photos, progress] = await Promise.all([
    getMyPhotosWithResults(user.id),
    getRatingProgress(user.id),
  ]);

  if (photos.length === 0) {
    return (
      <EmptyState
        title="還沒有照片"
        desc="上傳一張正面照，進入評分池，就能開始累積你的分眾定位。"
        href="/upload"
        cta="去上傳照片"
      />
    );
  }

  if (!progress.unlocked) {
    const remaining = progress.needed - progress.given;
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-bold" style={{ color: "#2C2926" }}>
          我的結果
        </h1>
        <div className="card-surface flex flex-col items-center gap-4 p-8 text-center">
          <span className="text-4xl" aria-hidden>
            🔒
          </span>
          <h2 className="text-lg font-bold" style={{ color: "#2C2926" }}>
            再評 {remaining} 張解鎖
          </h2>
          <p className="text-sm" style={{ color: "#7C7064" }}>
            互惠機制：先幫 {progress.needed} 張照片評分，才能查看別人對你的評價。
          </p>
          <Link
            href="/rate"
            className="rounded-2xl px-6 py-3 text-sm font-semibold text-white"
            style={{ background: "#C0396B" }}
          >
            繼續評分
          </Link>
        </div>
      </div>
    );
  }

  const beforePhoto = photos.find((p) => p.slot === 0);
  const afterPhoto = photos.find((p) => p.slot === 1);
  const delta =
    beforePhoto?.latestBatch && afterPhoto?.latestBatch
      ? round1(afterPhoto.latestBatch.averageScore - beforePhoto.latestBatch.averageScore)
      : null;

  const hasAnyBatch = photos.some((p) => p.latestBatch);

  // 主照片的歷次揭曉走勢（≥2 次才畫）
  const history = beforePhoto?.latestBatch
    ? await getResultHistory(beforePhoto.id)
    : [];
  const trendPoints = history.map((b) => ({
    date: new Intl.DateTimeFormat("zh-TW", {
      month: "numeric",
      day: "numeric",
    }).format(b.unlockedAt),
    score: b.averageScore,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "#2C2926" }}>
          我的結果
        </h1>
        {delta != null && (
          <span
            className="growth-pill"
            style={
              delta < 0
                ? { background: "#F6E2E8", color: "#C0396B" }
                : undefined
            }
          >
            {delta >= 0 ? "↑" : "↓"} {delta >= 0 ? "+" : ""}
            {delta.toFixed(1)} 對比照
          </span>
        )}
      </div>

      {!hasAnyBatch ? (
        <div className="card-surface flex flex-col items-center gap-3 p-8 text-center">
          <span className="text-4xl" aria-hidden>
            ⏳
          </span>
          <h2 className="text-lg font-bold" style={{ color: "#2C2926" }}>
            結果準備中
          </h2>
          <p className="text-sm" style={{ color: "#7C7064" }}>
            你的照片正在被評分。累積足夠評分後，每晚 {REVEAL_HOUR}:00 會揭曉最新結果。
          </p>
          <div className="mt-2 flex gap-4">
            {photos.map((p) => (
              <div key={p.id} className="text-center">
                <p className="text-2xl font-bold" style={{ color: "#C0396B" }}>
                  {p.ratingCount}
                </p>
                <p className="text-xs" style={{ color: "#9C8E7E" }}>
                  {p.label ?? (p.slot === 0 ? "主照片" : "對比照")}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {trendPoints.length >= 2 && <TrendChart points={trendPoints} />}
          {photos.map(
            (p) =>
              p.latestBatch && (
                <ResultCard
                  key={p.id}
                  batch={p.latestBatch}
                  label={p.label ?? (p.slot === 0 ? "主照片" : "對比照")}
                />
              ),
          )}
        </>
      )}
    </div>
  );
}
