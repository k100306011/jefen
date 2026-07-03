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
import { MAX_PHOTOS_PER_USER, SCORE_MIN, SCORE_MAX } from "./constants";

export type ActionState = { ok?: boolean; error?: string };

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
  if (!moderation.passed) {
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

  const storageKey = await savePhotoFile(bytes, file.type);
  await prisma.photo.create({
    data: {
      userId,
      storageKey,
      mimeType: file.type,
      label,
      slot, // 0 = 主照片，1 = 對比照
      status: "active",
      isActive: true,
    },
  });

  revalidatePath("/upload");
  revalidatePath("/results");
  revalidatePath("/dashboard");
  return { ok: true };
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
// 更新分眾屬性（設定頁）
// ─────────────────────────────────────────────
export async function updateProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await getSessionUserId();
  if (!userId) return { error: "請先登入" };

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
