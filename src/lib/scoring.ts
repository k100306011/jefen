import type { DemographicBreakdown } from "@/types";
import {
  GENDER_LABELS,
  AGE_LABELS,
  REGION_LABELS,
  MIN_BUCKET_SAMPLE,
  accentColor,
} from "./constants";

export interface ScoringRating {
  score: number;
  raterGender: string | null;
  raterAgeRange: string | null;
  raterRegion: string | null;
}

export function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

type Dimension = "gender" | "age" | "region";

function breakdownBy(
  ratings: ScoringRating[],
  field: keyof Pick<ScoringRating, "raterGender" | "raterAgeRange" | "raterRegion">,
  dimension: Dimension,
  labelFor: (key: string) => string,
): DemographicBreakdown[] {
  const groups = new Map<string, number[]>();
  for (const r of ratings) {
    const key = r[field];
    if (!key) continue;
    const arr = groups.get(key) ?? [];
    arr.push(r.score);
    groups.set(key, arr);
  }

  return Array.from(groups.entries())
    .map(([key, scores]) => ({
      key,
      score: round1(average(scores)),
      sampleSize: scores.length,
    }))
    // k-匿名：樣本太少的小組不輸出，否則等於公開某個人給的分數。
    .filter((g) => g.sampleSize >= MIN_BUCKET_SAMPLE)
    .sort((a, b) => b.score - a.score || b.sampleSize - a.sampleSize)
    .map((g, i) => ({
      dimension,
      label: labelFor(g.key),
      score: g.score,
      sampleSize: g.sampleSize,
      color: accentColor(i),
    }));
}

export function computeBreakdowns(ratings: ScoringRating[]): {
  byGender: DemographicBreakdown[];
  byAge: DemographicBreakdown[];
  byRegion: DemographicBreakdown[];
} {
  return {
    byGender: breakdownBy(
      ratings,
      "raterGender",
      "gender",
      (k) => `${GENDER_LABELS[k as keyof typeof GENDER_LABELS] ?? k}眼中`,
    ),
    byAge: breakdownBy(
      ratings,
      "raterAgeRange",
      "age",
      (k) => AGE_LABELS[k as keyof typeof AGE_LABELS] ?? k,
    ),
    byRegion: breakdownBy(
      ratings,
      "raterRegion",
      "region",
      (k) => REGION_LABELS[k as keyof typeof REGION_LABELS] ?? k,
    ),
  };
}

export function confidenceFromSampleSize(n: number): "low" | "medium" | "high" {
  if (n < 15) return "low";
  if (n < 50) return "medium";
  return "high";
}

/** value 在 population（所有照片平均分）中的百分位（0–100）。 */
export function percentileRank(value: number, population: number[]): number {
  if (population.length === 0) return 50;
  const atOrBelow = population.filter((v) => v <= value).length;
  return Math.round((atOrBelow / population.length) * 100);
}
