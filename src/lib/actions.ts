"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "./auth";
import { prisma } from "./db";
import {
  savePhotoFile,
  deletePhotoFile,
  ALLOWED_IMAGE_MIME,
  MAX_UPLOAD_BYTES,
} from "./storage";
import { moderatePhoto } from "./moderation";
import { rateLimit, LIMITS } from "./rate-limit";
import { MAX_PHOTOS_PER_USER, SCORE_MIN, SCORE_MAX } from "./constants";

export type ActionState = { ok?: boolean; error?: string; notice?: string };

const GENDERS = ["male", "female", "non_binary", "prefer_not_to_say"] as const;
const AGES = ["18-24", "25-30", "31-40", "41-50", "51+"] as const;
const REGIONS = [
  "taipei",
  "northern",
  "central",
  "southern",
  "eastern",
  "overseas",
] as const;

async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

// 超出額度時回傳統一的錯誤訊息，否則回傳 null。
function limitError(
  action: keyof typeof LIMITS,
  userId: string,
): ActionState | null {
  const { limit, windowSec } = LIMITS[action];
  const res = rateLimit(`${action}:${userId}`, limit, windowSec);
  if (res.ok) return null;
  return { error: `操作太頻繁，請於 ${res.retryAfterSec} 秒後再試` };
}

// ─────────────────────────────────────────────
// Onboarding：填寫分眾屬性 + 18 歲確認
// ─────────────────────────────────────────────
const onboardingSchema = z.object({
  gender: z.enum(GENDERS),
  ageRange: z.enum(AGES),
  region: z.enum(REGIONS),
});

export async function completeOnboarding(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await getSessionUserId();
  if (!userId) return { error: "請先登入" };

  if (formData.get("verify18") !== "on") {
    return { error: "需確認你已年滿 18 歲" };
  }

  const parsed = onboardingSchema.safeParse({
    gender: formData.get("gender"),
    ageRange: formData.get("ageRange"),
    region: formData.get("region"),
  });
  if (!parsed.success) {
    return { error: "請完整選擇性別、年齡與地區" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      gender: parsed.data.gender,
      ageRange: parsed.data.ageRange,
      region: parsed.data.region,
      isVerified18: true,
      onboardedAt: new Date(),
    },
  });

  redirect("/upload?welcome=1");
}

// ─────────────────────────────────────────────
// 上傳照片（含審核）
// ─────────────────────────────────────────────
export async function uploadPhoto(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await getSessionUserId();
  if (!userId) return { error: "請先登入" };

  const limited = limitError("upload", userId);
  if (limited) return limited;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.onboardedAt) return { error: "請先完成基本資料" };

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "請選擇一張照片" };
  }
  if (!ALLOWED_IMAGE_MIME.includes(file.type)) {
    return { error: "僅支援 JPG / PNG / WebP 格式" };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "照片需小於 8MB" };
  }

  // 找出最小的空 slot（刪除後重傳不會撞號）
  const existing = await prisma.photo.findMany({
    where: { userId },
    select: { slot: true },
  });
  if (existing.length >= MAX_PHOTOS_PER_USER) {
    return { error: `最多只能上傳 ${MAX_PHOTOS_PER_USER} 張照片` };
  }
  const usedSlots = new Set(existing.map((p) => p.slot));
  let slot = 0;
  while (usedSlots.has(slot)) slot++;

  const labelRaw = String(formData.get("label") ?? "").trim();
  const label = labelRaw.length > 0 ? labelRaw.slice(0, 20) : null;

  const bytes = Buffer.from(await file.arrayBuffer());

  // AI 守門員審核
  const moderation = await moderatePhoto(bytes.toString("base64"), file.type);

  // 明確違規 → 直接拒絕，不落地檔案。
  if (!moderation.passed && !moderation.requiresManualReview) {
    const reasons: Record<string, string> = {
      nsfw: "照片含不適當內容",
      underage: "無法確認照片主角已成年",
      not_real_person: "請上傳真人照片（非卡通／名人／素材圖）",
      low_quality: "照片品質不足，請換一張清晰的正面照",
    };
    return {
      error: reasons[moderation.reason ?? "low_quality"] ?? "照片未通過審核",
    };
  }

  // 無法自動判定（審核服務未設定或異常）→ 收下但不進評分池，等人工複審。
  const pendingReview = moderation.requiresManualReview === true;

  const storageKey = await savePhotoFile(bytes, file.type);
  await prisma.photo.create({
    data: {
      userId,
      storageKey,
      mimeType: file.type,
      label,
      slot, // 0 = 主照片，1 = 對比照
      status: pendingReview ? "pending_review" : "active",
      isActive: !pendingReview,
      moderationReason: pendingReview ? "unreviewed" : null,
    },
  });

  revalidatePath("/upload");
  revalidatePath("/results");
  revalidatePath("/dashboard");
  return pendingReview
    ? {
        ok: true,
        notice:
          "照片已收到，正在等待審核。通過後才會進入評分池，你會在此頁看到狀態變更。",
      }
    : { ok: true };
}

// ─────────────────────────────────────────────
// 評分（1–10 或「不可評」），互惠機制的基礎
// ─────────────────────────────────────────────
export async function submitRating(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await getSessionUserId();
  if (!userId) return { error: "請先登入" };

  const limited = limitError("rating", userId);
  if (limited) return limited;

  const rater = await prisma.user.findUnique({ where: { id: userId } });
  if (!rater?.onboardedAt) return { error: "請先完成基本資料" };

  const photoId = String(formData.get("photoId") ?? "");
  if (!photoId) return { error: "缺少照片資訊" };

  const unevaluable = formData.get("unevaluable") === "1";
  let score: number | null = null;
  if (!unevaluable) {
    const parsed = z.coerce
      .number()
      .int()
      .min(SCORE_MIN)
      .max(SCORE_MAX)
      .safeParse(formData.get("score"));
    if (!parsed.success) return { error: `分數需介於 ${SCORE_MIN}–${SCORE_MAX}` };
    score = parsed.data;
  }

  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo || !photo.isActive || photo.status !== "active") {
    return { error: "這張照片目前無法評分" };
  }
  if (photo.userId === userId) {
    return { error: "不能為自己的照片評分" };
  }

  try {
    await prisma.rating.create({
      data: {
        raterId: userId,
        photoId,
        score,
        isUnevaluable: unevaluable,
        raterGender: rater.gender,
        raterAgeRange: rater.ageRange,
        raterRegion: rater.region,
      },
    });
  } catch {
    // 違反 unique(raterId, photoId)：已評過，視為成功略過
    return { ok: true };
  }

  // 不 revalidate /rate：讓前端自主逐張推進，整批評完才主動刷新。
  revalidatePath("/dashboard");
  return { ok: true };
}

// ─────────────────────────────────────────────
// 檢舉照片：任何登入者都能檢舉評分池中的照片。
// 一筆檢舉即立刻下架該照片等人工複審——保護當事人優先。
// ─────────────────────────────────────────────
const REPORT_REASONS = ["not_self", "nsfw", "minor", "other"] as const;

export async function reportPhoto(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await getSessionUserId();
  if (!userId) return { error: "請先登入" };

  const limited = limitError("report", userId);
  if (limited) return limited;

  const photoId = String(formData.get("photoId") ?? "");
  if (!photoId) return { error: "缺少照片資訊" };

  const parsed = z.enum(REPORT_REASONS).safeParse(formData.get("reason"));
  if (!parsed.success) return { error: "請選擇檢舉原因" };

  const note = String(formData.get("note") ?? "")
    .trim()
    .slice(0, 200);

  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return { error: "找不到這張照片" };
  if (photo.userId === userId) return { error: "不能檢舉自己的照片" };

  // 重複檢舉視為已受理（不洩漏狀態、也不報錯）。
  try {
    await prisma.photoReport.create({
      data: {
        photoId,
        reporterId: userId,
        reason: parsed.data,
        note: note.length > 0 ? note : null,
      },
    });
  } catch {
    return { ok: true, notice: "你已檢舉過這張照片，我們正在處理。" };
  }

  // 立即下架，等人工複審。
  await prisma.photo.update({
    where: { id: photoId },
    data: {
      status: "flagged",
      isActive: false,
      moderationReason: `reported:${parsed.data}`,
    },
  });

  revalidatePath("/rate");
  return {
    ok: true,
    notice: "已收到你的檢舉，這張照片已下架等待審核。謝謝你協助維護社群安全。",
  };
}

// ─────────────────────────────────────────────
// 更新分眾屬性（設定頁）
// ─────────────────────────────────────────────
export async function updateProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await getSessionUserId();
  if (!userId) return { error: "請先登入" };

  const limited = limitError("profile", userId);
  if (limited) return limited;

  const parsed = onboardingSchema.safeParse({
    gender: formData.get("gender"),
    ageRange: formData.get("ageRange"),
    region: formData.get("region"),
  });
  if (!parsed.success) {
    return { error: "請完整選擇性別、年齡與地區" };
  }

  const nameRaw = String(formData.get("name") ?? "").trim();

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...parsed.data,
      ...(nameRaw ? { name: nameRaw.slice(0, 30) } : {}),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

// ─────────────────────────────────────────────
// 刪除照片（連同檔案與相關評分／結果，由 DB cascade 處理關聯）
// ─────────────────────────────────────────────
export async function deletePhoto(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await getSessionUserId();
  if (!userId) return { error: "請先登入" };

  const photoId = String(formData.get("photoId") ?? "");
  if (!photoId) return { error: "缺少照片資訊" };

  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo || photo.userId !== userId) {
    return { error: "找不到這張照片" };
  }

  await prisma.photo.delete({ where: { id: photoId } });
  await deletePhotoFile(photo.storageKey);

  revalidatePath("/upload");
  revalidatePath("/results");
  revalidatePath("/dashboard");
  return { ok: true };
}

// ─────────────────────────────────────────────
// 刪除帳號（一併清除照片檔案；DB 關聯由 cascade 處理）
// ─────────────────────────────────────────────
export async function deleteAccount(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await getSessionUserId();
  if (!userId) return { error: "請先登入" };

  if (String(formData.get("confirm") ?? "") !== "DELETE") {
    return { error: "請輸入 DELETE 確認刪除" };
  }

  const photos = await prisma.photo.findMany({
    where: { userId },
    select: { storageKey: true },
  });

  await prisma.user.delete({ where: { id: userId } });
  await Promise.all(photos.map((p) => deletePhotoFile(p.storageKey)));

  // 前端收到 ok 後呼叫 signOut() 清除 JWT session
  return { ok: true };
}
