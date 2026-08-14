import type { Gender, AgeRange, Region } from "@/types";

// ── 業務規則 ──
export const RATINGS_NEEDED_FOR_UNLOCK = 10; // 自己評滿 10 人 → 解鎖查看資格
export const MIN_RATINGS_FOR_BATCH = 5; // 一張照片被評滿幾次才會生成結果
// 單一分眾小組（例如「台北」「18–24 歲」）至少要有這麼多評分才顯示，
// 否則可反推出某個特定使用者給了幾分（k-匿名保護）。
export const MIN_BUCKET_SAMPLE = 3;
export const MAX_PHOTOS_PER_USER = 2; // 主照片 + 對比照
export const REVEAL_HOUR = 21; // 每晚 21:00 揭曉
export const REVEAL_CRON = "0 21 * * *"; // node-cron 表達式（伺服器時區）
export const SCORE_MIN = 1;
export const SCORE_MAX = 10;

// ── 分眾選項與標籤 ──
export const GENDER_LABELS: Record<Gender, string> = {
  female: "女生",
  male: "男生",
  non_binary: "非二元",
  prefer_not_to_say: "不願透露",
};

export const AGE_LABELS: Record<AgeRange, string> = {
  "18-24": "18–24 歲",
  "25-30": "25–30 歲",
  "31-40": "31–40 歲",
  "41-50": "41–50 歲",
  "51+": "51 歲以上",
};

export const REGION_LABELS: Record<Region, string> = {
  taipei: "台北",
  northern: "北部",
  central: "中部",
  southern: "南部",
  eastern: "東部",
  overseas: "海外",
};

export const GENDER_OPTIONS = (Object.keys(GENDER_LABELS) as Gender[]).map((value) => ({
  value,
  label: GENDER_LABELS[value],
}));

export const AGE_OPTIONS = (Object.keys(AGE_LABELS) as AgeRange[]).map((value) => ({
  value,
  label: AGE_LABELS[value],
}));

export const REGION_OPTIONS = (Object.keys(REGION_LABELS) as Region[]).map((value) => ({
  value,
  label: REGION_LABELS[value],
}));

// 分眾卡片用的強調色（rose / gold / teal 輪替）
export const ACCENT_COLORS = ["#E8628A", "#EBA63E", "#46C2A6", "#C0396B", "#7C9CF4"];

export function accentColor(index: number): string {
  return ACCENT_COLORS[index % ACCENT_COLORS.length];
}
