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
import { MIN_RATINGS_FOR_BATCH } from "./constants";

export interface RevealSummary {
  revealedPhotos: number;
  totalRatingsCounted: number;
  ranAt: string;
}

/**
 * 揭曉：為所有「進入評分池且被評滿門檻」的照片產生一份結果批次快照。
 * 由每晚 21:00 的排程或受保護的 /api/cron 觸發；可重複執行（產生新的快照）。
 */
export async function revealAll(opts?: { minRatings?: number }): Promise<RevealSummary> {
  const minRatings = opts?.minRatings ?? MIN_RATINGS_FOR_BATCH;

  const photos = await prisma.photo.findMany({
    where: { isActive: true, status: "active" },
    include: {
      ratings: {
        where: { isUnevaluable: false, score: { not: null } },
        select: {
          score: true,
          raterGender: true,
          raterAgeRange: true,
          raterRegion: true,
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
      return { photo, ratings, avg: round1(average(ratings.map((r) => r.score))) };
    })
    .filter((e) => e.ratings.length >= minRatings);

  const population = eligible.map((e) => e.avg);

  let totalCounted = 0;
  for (const { photo, ratings, avg } of eligible) {
    const { byGender, byAge, byRegion } = computeBreakdowns(ratings);
    await prisma.resultBatch.create({
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
    totalCounted += ratings.length;
  }

  return {
    revealedPhotos: eligible.length,
    totalRatingsCounted: totalCounted,
    ranAt: new Date().toISOString(),
  };
}
