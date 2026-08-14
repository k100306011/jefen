import "server-only";
import { prisma } from "./db";
import {
  computeBreakdowns,
  average,
  round1,
  percentileRank,
  confidenceFromSampleSize,
  type ScoringRating,
} from "./scoring";
import { MIN_RATINGS_FOR_BATCH, REVEAL_HOUR } from "./constants";

export interface RevealSummary {
  revealedPhotos: number;
  totalRatingsCounted: number;
  skippedNoNewRatings: number;
  ranAt: string;
}

/**
 * 揭曉：為「進入評分池且被評滿門檻」的照片產生結果批次快照。
 *
 * 冪等性：只有當照片自上次揭曉後**有新的評分**（Rating.countedBatchId 為 null）
 * 才會產生新批次；否則跳過。因此重複執行（或每晚固定觸發但當天沒人評分）
 * 不會灌出一堆一模一樣的快照污染趨勢圖。
 *
 * 每份快照的分數仍是**累積**計算（用該照片至今所有有效評分），
 * 只有「是否值得產生新快照」這件事看新評分。
 */
export async function revealAll(opts?: { minRatings?: number }): Promise<RevealSummary> {
  const minRatings = opts?.minRatings ?? MIN_RATINGS_FOR_BATCH;

  const photos = await prisma.photo.findMany({
    where: { isActive: true, status: "active" },
    include: {
      ratings: {
        where: { isUnevaluable: false, score: { not: null } },
        select: {
          id: true,
          score: true,
          raterGender: true,
          raterAgeRange: true,
          raterRegion: true,
          countedBatchId: true,
        },
      },
    },
  });

  const eligible = photos
    .map((photo) => {
      const ratings: ScoringRating[] = photo.ratings.map((r) => ({
        score: r.score as number,
        raterGender: r.raterGender,
        raterAgeRange: r.raterAgeRange,
        raterRegion: r.raterRegion,
      }));
      // 尚未被任何批次計入的評分 id。
      const uncountedIds = photo.ratings
        .filter((r) => r.countedBatchId === null)
        .map((r) => r.id);
      return {
        photo,
        ratings,
        uncountedIds,
        avg: round1(average(ratings.map((r) => r.score))),
      };
    })
    .filter((e) => e.ratings.length >= minRatings);

  // 百分位的比較族群＝所有達到門檻的照片（不論這次是否產生新快照），
  // 這樣百分位不會因為當晚誰剛好有新評分而跳動。
  const population = eligible.map((e) => e.avg);

  let totalCounted = 0;
  let revealed = 0;
  let skipped = 0;

  for (const { photo, ratings, uncountedIds, avg } of eligible) {
    // 沒有新評分 → 結果不會變，不產生重複快照。
    if (uncountedIds.length === 0) {
      skipped++;
      continue;
    }

    const { byGender, byAge, byRegion } = computeBreakdowns(ratings);
    const batch = await prisma.resultBatch.create({
      data: {
        photoId: photo.id,
        totalRatings: ratings.length,
        averageScore: avg,
        percentileRank: percentileRank(avg, population),
        confidence: confidenceFromSampleSize(ratings.length),
        byGender: JSON.stringify(byGender),
        byAge: JSON.stringify(byAge),
        byRegion: JSON.stringify(byRegion),
      },
    });

    // 標記這些評分已被計入，避免下次重複觸發新批次。
    await prisma.rating.updateMany({
      where: { id: { in: uncountedIds } },
      data: { countedBatchId: batch.id },
    });

    revealed++;
    totalCounted += ratings.length;
  }

  return {
    revealedPhotos: revealed,
    totalRatingsCounted: totalCounted,
    skippedNoNewRatings: skipped,
    ranAt: new Date().toISOString(),
  };
}

/**
 * 補跑：若最近一次「應該揭曉的時間」之後還沒有任何批次產生，就補跑一次。
 * 用於容器在 21:00 剛好沒開機的情況（否則那天的揭曉會永遠被跳過）。
 * 因為 revealAll 已具冪等性，補跑是安全的。
 */
export async function revealIfMissed(): Promise<RevealSummary | null> {
  const now = new Date();
  // 最近一次已經過去的 REVEAL_HOUR（伺服器時區＝ TZ，部署為 Asia/Taipei）。
  const lastScheduled = new Date(now);
  lastScheduled.setHours(REVEAL_HOUR, 0, 0, 0);
  if (lastScheduled > now) {
    lastScheduled.setDate(lastScheduled.getDate() - 1);
  }

  const since = await prisma.resultBatch.findFirst({
    where: { unlockedAt: { gte: lastScheduled } },
    select: { id: true },
  });
  if (since) return null; // 該時段已揭曉過

  // 沒有待計入的新評分時 revealAll 會全部跳過，成本極低。
  return revealAll();
}
