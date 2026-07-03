"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePhoto } from "@/lib/actions";

export function DeletePhotoButton({ photoId }: { photoId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs"
        style={{ color: "#B0A496" }}
      >
        刪除
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const fd = new FormData();
            fd.set("photoId", photoId);
            await deletePhoto({}, fd);
            router.refresh();
          })
        }
        className="text-xs font-semibold disabled:opacity-50"
        style={{ color: "#C0396B" }}
      >
        {isPending ? "刪除中…" : "確定刪除？"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-xs"
        style={{ color: "#B0A496" }}
      >
        取消
      </button>
    </span>
  );
}
