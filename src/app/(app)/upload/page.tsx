import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getMyPhotosWithResults } from "@/lib/queries";
import { UploadForm } from "@/components/app/UploadForm";
import { DeletePhotoButton } from "@/components/app/DeletePhotoButton";
import { MAX_PHOTOS_PER_USER } from "@/lib/constants";

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const [photos, sp] = await Promise.all([
    getMyPhotosWithResults(user.id),
    searchParams,
  ]);
  const welcome = sp.welcome === "1";
  const canUploadMore = photos.length < MAX_PHOTOS_PER_USER;
  const statusLabel: Record<string, string> = {
    active: "評分中",
    pending_review: "審核中",
    rejected: "未通過",
    flagged: "已標記",
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#2C2926" }}>
          {welcome ? "上傳第一張照片" : "你的照片"}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#7C7064" }}>
          {welcome
            ? "歡迎加入！上傳一張正面照，AI 守門員會先把關，再送進評分池。"
            : "最多 2 張。上傳第二張對比照（如「剪髮後」），就能看到分數的變化。"}
        </p>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {photos.map((p) => (
            <div key={p.id} className="card-surface overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/photos/${p.id}`}
                alt={p.label ?? "我的照片"}
                className="aspect-square w-full object-cover"
              />
              <div className="flex flex-col gap-1 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: "#2C2926" }}>
                    {p.label ?? (p.slot === 0 ? "主照片" : "對比照")}
                  </span>
                  <span className="text-xs" style={{ color: "#9C8E7E" }}>
                    {statusLabel[p.status] ?? p.status} · {p.ratingCount} 評
                  </span>
                </div>
                <DeletePhotoButton photoId={p.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      {canUploadMore ? (
        <UploadForm key={photos.length} isComparison={photos.length === 1} />
      ) : (
        <p className="text-sm" style={{ color: "#9C8E7E" }}>
          已達上傳上限（{MAX_PHOTOS_PER_USER} 張）。
        </p>
      )}

      {photos.length > 0 && (
        <div className="flex gap-3">
          <Link
            href="/rate"
            className="flex-1 rounded-2xl py-3 text-center text-sm font-semibold text-white"
            style={{ background: "#C0396B" }}
          >
            去評分，解鎖我的結果
          </Link>
          <Link
            href="/results"
            className="flex-1 rounded-2xl py-3 text-center text-sm font-semibold"
            style={{ background: "#fff", color: "#5C5248", border: "0.5px solid #EBE3D7" }}
          >
            查看我的結果
          </Link>
        </div>
      )}
    </div>
  );
}
