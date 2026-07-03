"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { submitRating } from "@/lib/actions";

interface QueueItem {
  id: string;
  label: string | null;
}

function ProgressBar({ given, needed }: { given: number; needed: number }) {
  const pct = Math.min((given / needed) * 100, 100);
  const remaining = Math.max(needed - given, 0);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs" style={{ color: "#9C8E7E" }}>
        <span>{given >= needed ? "已解鎖查看資格" : `再評 ${remaining} 人解鎖你的結果`}</span>
        <span>
          {Math.min(given, needed)}/{needed}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "#EFE8DB" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: "#C0396B" }}
        />
      </div>
    </div>
  );
}

function ScorePad({
  onScore,
  onSkip,
  disabled,
}: {
  onScore: (s: number) => void;
  onSkip: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onScore(n)}
            className="aspect-square rounded-xl text-lg font-bold transition-all disabled:opacity-50"
            style={{
              background: "#fff",
              color: "#2C2926",
              border: "0.5px solid #EBE3D7",
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onSkip}
        className="self-center text-sm disabled:opacity-50"
        style={{ color: "#B0A496" }}
      >
        看不清 / 不可評，略過 →
      </button>
    </div>
  );
}

export function RatingDeck({
  queue,
  given,
  needed,
}: {
  queue: QueueItem[];
  given: number;
  needed: number;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [doneInBatch, setDoneInBatch] = useState(0);
  const [isPending, startTransition] = useTransition();

  // 取得新一批時由父層的 key 觸發 remount 自動重置本批進度（見 rate/page.tsx）。
  const current = queue[index];
  const totalGiven = given + doneInBatch;

  function rate(score: number | null, unevaluable = false) {
    if (!current || isPending) return;
    const photoId = current.id;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("photoId", photoId);
      if (unevaluable) fd.set("unevaluable", "1");
      else if (score != null) fd.set("score", String(score));
      await submitRating({}, fd);
      setDoneInBatch((c) => c + 1);
      setIndex((i) => i + 1);
    });
  }

  if (!current) {
    const finishedAny = doneInBatch > 0;
    return (
      <div className="card-surface flex flex-col items-center gap-4 p-8 text-center">
        <span className="text-4xl" aria-hidden>
          {finishedAny ? "🎉" : "🌙"}
        </span>
        <h2 className="text-xl font-bold" style={{ color: "#2C2926" }}>
          {finishedAny ? "這批評完了！" : "目前沒有更多可評的人"}
        </h2>
        <p className="text-sm" style={{ color: "#7C7064" }}>
          {totalGiven >= needed
            ? "你已達解鎖門檻，每晚 21:00 會揭曉你的最新結果。"
            : `再評 ${needed - totalGiven} 人，就能解鎖查看自己的結果。`}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="rounded-2xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: "#C0396B" }}
          >
            再評一批
          </button>
          <Link
            href="/results"
            className="rounded-2xl px-5 py-2.5 text-sm font-semibold"
            style={{ background: "#fff", color: "#5C5248", border: "0.5px solid #EBE3D7" }}
          >
            看我的結果
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ProgressBar given={totalGiven} needed={needed} />

      <div className="card-surface overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/photos/${current.id}`}
          alt="待評分照片"
          className="aspect-[4/5] w-full bg-[#EFE8DB] object-cover"
        />
        {current.label && (
          <div className="px-4 py-2 text-sm" style={{ color: "#7C7064" }}>
            {current.label}
          </div>
        )}
      </div>

      <p className="text-center text-sm" style={{ color: "#9C8E7E" }}>
        憑第一眼直覺，給幾分？
      </p>
      <ScorePad onScore={(s) => rate(s)} onSkip={() => rate(null, true)} disabled={isPending} />
    </div>
  );
}
