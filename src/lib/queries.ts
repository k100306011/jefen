import "server-only";
import { cache } from "react";
import { prisma } from "./db";
import { auth } from "./auth";
import { RATINGS_NEEDED_FOR_UNLOCK } from "./constants";
import type { DemographicBreakdown, ResultBatch } from "@/types";

// ── 結果批次：DB(JSON 字串) → 前端 view ──
function parseBreakdowns(s: string): DemographicBreakdown[] {
  try {
    return JSON.parse(s) as DemographicBreakdown[];
  } catch {
    return [];
  }
}

interface DbBatch {
  id: string;
  photoId: string;
  unlockedAt: Date;
  totalRatings: number;
  averageScore: number;
  percentileRank: number;
  confidence: string;
  byGender: string;
  byAge: string;
  byRegion: string;
}

export function toResultBatchView(b: DbBatch): ResultBatch {
  return {
    id: b.id,
    photoId: b.photoId,
    unlockedAt: b.unlockedAt,
    totalRatings: b.totalRatings,
    averageScore: b.averageScore,
    percentileRank: b.percentileRank,
    confidence: b.confidence as ResultBatch["confidence"],
    byGender: parseBreakdowns(b.byGender),
    byAge: parseBreakdowns(b.byAge),
    byRegion: parseBreakdowns(b.byRegion),
  };
}

// ── 目前登入者（同一 request 去重）──
export const getCurrentUser = cache(async () => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
});

// ── 評分進度 ──
export async function getRatingProgress(userId: string) {
  const given = await prisma.rating.count({ where: { raterId: userId } });
  return {
    given,
    needed: RATINGS_NEEDED_FOR_UNLOCK,
    unlocked: given >= RATINGS_NEEDED_FOR_UNLOCK,
  };
}

// ── 待評佇列：他人 active 照片，排除自己與已評過者，被評最少的優先 ──
export async function getRatingQueue(userId: string, limit = 12) {
  const rated = await prisma.rating.findMany({
    where: { raterId: userId },
    select: { photoId: true },
  });
  const ratedIds = rated.map((r) => r.photoId);

  return prisma.photo.findMany({
    where: {
      isActive: true,
      status: "active",
      userId: { not: userId },
      id: { notIn: ratedIds.length ? ratedIds : undefined },
    },
    orderBy: [{ ratings: { _count: "asc" } }, { createdAt: "asc" }],
    take: limit,
    select: { id: true, storageKey: true, label: true },
  });
}

export async function countRateablePhotos(userId: string) {
  const rated = await prisma.rating.findMany({
    where: { raterId: userId },
    select: { photoId: true },
  });
  const ratedIds = rated.map((r) => r.photoId);
  return prisma.photo.count({
    where: {
      isActive: true,
      status: "active",
      userId: { not: userId },
      id: { notIn: ratedIds.length ? ratedIds : undefined },
    },
  });
}

// ── 全站統計（落地頁社會證明用，真實數字）──
// 容錯：落地頁會在 build 時預渲染（如 Docker builder 階段，當下還沒有資料庫），
// 查詢失敗時回傳 0，待 ISR 於執行期再生時取得真實數字。
export async function getSiteStats() {
  try {
    const [photosInPool, totalRatings, totalUsers] = await Promise.all([
      prisma.photo.count({ where: { isActive: true, status: "active" } }),
      prisma.rating.count(),
      prisma.user.count(),
    ]);
    return { photosInPool, totalRatings, totalUsers };
  } catch {
    return { photosInPool: 0, totalRatings: 0, totalUsers: 0 };
  }
}

// ── 歷次揭曉批次（趨勢曲線用，由舊到新）──
export async function getResultHistory(photoId: string, limit = 30) {
  const batches = await prisma.resultBatch.findMany({
    where: { photoId },
    orderBy: { unlockedAt: "desc" },
    take: limit,
    select: {
      id: true,
      unlockedAt: true,
      averageScore: true,
      percentileRank: true,
      totalRatings: true,
    },
  });
  return batches.reverse();
}

// ── 自己的照片 + 最新結果批次 ──
export async function getMyPhotosWithResults(userId: string) {
  const photos = await prisma.photo.findMany({
    where: { userId },
    orderBy: { slot: "asc" },
    include: {
      batches: { orderBy: { unlockedAt: "desc" }, take: 1 },
      _count: { select: { ratings: true } },
    },
  });

  return photos.map((p) => ({
    id: p.id,
    storageKey: p.storageKey,
    label: p.label,
    slot: p.slot,
    status: p.status,
    isActive: p.isActive,
    moderationReason: p.moderationReason,
    ratingCount: p._count.ratings,
    latestBatch: p.batches[0] ? toResultBatchView(p.batches[0]) : null,
  }));
}

export type MyPhotoWithResult = Awaited<
  ReturnType<typeof getMyPhotosWithResults>
>[number];
