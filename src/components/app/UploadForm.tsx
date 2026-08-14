"use client";

import { useActionState, useState } from "react";
import { uploadPhoto, type ActionState } from "@/lib/actions";
import { PrimaryCTA } from "@/components/ui/PrimaryCTA";

const initialState: ActionState = {};

// 上傳成功後，父層會以 key（已上傳照片數）觸發 remount 來清空表單（見 upload/page.tsx）。
export function UploadForm({ isComparison }: { isComparison: boolean }) {
  const [state, action, pending] = useActionState(uploadPhoto, initialState);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <form action={action} className="card-surface p-5 flex flex-col gap-4">
      <label
        className="flex flex-col items-center justify-center gap-2 rounded-2xl py-8 cursor-pointer text-center"
        style={{ border: "1.5px dashed #D8CDBC", background: "#FBF8F3" }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="預覽"
            className="h-44 w-44 rounded-xl object-cover"
          />
        ) : (
          <>
            <span className="text-3xl" aria-hidden>
              ＋
            </span>
            <span className="text-sm font-medium" style={{ color: "#5C5248" }}>
              點此選擇照片
            </span>
            <span className="text-xs" style={{ color: "#B0A496" }}>
              清晰正面照效果最好 · JPG/PNG/WebP · 8MB 內
            </span>
          </>
        )}
        <input
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
        />
      </label>

      {isComparison && (
        <div className="flex flex-col gap-1.5">
          <label className="text-label-eyebrow" htmlFor="label">
            對比照標籤（選填）
          </label>
          <input
            id="label"
            name="label"
            maxLength={20}
            placeholder="例如：剪髮後、妝後、增肌後"
            className="rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ border: "0.5px solid #EBE3D7", background: "#fff", color: "#2C2926" }}
          />
        </div>
      )}

      {state.error && (
        <p className="text-sm" style={{ color: "#D6356E" }}>
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="text-sm" style={{ color: "#5E7A4E" }}>
          {state.notice ?? "上傳成功，已送進評分池！"}
        </p>
      )}

      <PrimaryCTA type="submit" loading={pending} className="w-full">
        上傳照片
      </PrimaryCTA>
    </form>
  );
}
