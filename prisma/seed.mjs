// 幾分 — demo 種子資料（自包含，可獨立用 `node prisma/seed.mjs` 執行）
// 建立示範帳號 + 一批評分者 + 互相評分，並產生第一份揭曉結果，讓登入後立即有東西可看。
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

// ── 連線（與 src/lib/db.ts 相同的路徑正規化）──
const raw = process.env.DATABASE_URL ?? "file:./data/jifen.db";
const url = raw.startsWith("file:")
  ? `file:${path.resolve(process.cwd(), raw.slice(5))}`
  : raw;
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(process.cwd(), "data");
const UPLOADS = path.join(DATA_DIR, "uploads");
await fs.mkdir(UPLOADS, { recursive: true });

// 1x1 純色 PNG 佔位圖（demo 用，避免破圖）
const PLACEHOLDER = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
async function writePlaceholder() {
  const key = `${randomUUID()}.png`;
  await fs.writeFile(path.join(UPLOADS, key), PLACEHOLDER);
  return key;
}

const GENDER_LABELS = { female: "女生", male: "男生", non_binary: "非二元" };
const AGE_LABELS = {
  "18-24": "18–24 歲",
  "25-30": "25–30 歲",
  "31-40": "31–40 歲",
  "41-50": "41–50 歲",
};
const REGION_LABELS = {
  taipei: "台北",
  northern: "北部",
  central: "中部",
  southern: "南部",
  overseas: "海外",
};
const COLORS = ["#E8628A", "#EBA63E", "#46C2A6", "#C0396B", "#7C9CF4"];
const genders = Object.keys(GENDER_LABELS);
const ages = Object.keys(AGE_LABELS);
const regions = Object.keys(REGION_LABELS);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const round1 = (n) => Math.round(n * 10) / 10;
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

function breakdown(ratings, field, dim, labelMap) {
  const groups = new Map();
  for (const r of ratings) {
    const k = r[field];
    if (!k) continue;
    const arr = groups.get(k) ?? [];
    arr.push(r.score);
    groups.set(k, arr);
  }
  return [...groups.entries()]
    .map(([k, s]) => ({ key: k, score: round1(avg(s)), sampleSize: s.length }))
    .sort((a, b) => b.score - a.score || b.sampleSize - a.sampleSize)
    .map((g, i) => ({
      dimension: dim,
      label: (labelMap[g.key] ?? g.key) + (dim === "gender" ? "眼中" : ""),
      score: g.score,
      sampleSize: g.sampleSize,
      color: COLORS[i % COLORS.length],
    }));
}

// ── 示範主角 ──
const hero = await prisma.user.upsert({
  where: { email: "demo@jifen.app" },
  update: {
    gender: "male",
    ageRange: "25-30",
    region: "taipei",
    isVerified18: true,
    onboardedAt: new Date(),
  },
  create: {
    email: "demo@jifen.app",
    name: "示範帳號",
    gender: "male",
    ageRange: "25-30",
    region: "taipei",
    isVerified18: true,
    onboardedAt: new Date(),
  },
});

let heroPhoto = await prisma.photo.findFirst({
  where: { userId: hero.id, slot: 0 },
});
if (!heroPhoto) {
  heroPhoto = await prisma.photo.create({
    data: {
      userId: hero.id,
      storageKey: await writePlaceholder(),
      mimeType: "image/png",
      slot: 0,
      status: "active",
      isActive: true,
    },
  });
}

// ── 評分者 + 評分 ──
const N = 30;
for (let i = 0; i < N; i++) {
  const email = `rater${i}@seed.local`;
  const g = pick(genders);
  const a = pick(ages);
  const reg = pick(regions);
  const u = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: `評分者${i}`,
      gender: g,
      ageRange: a,
      region: reg,
      isVerified18: true,
      onboardedAt: new Date(),
    },
  });

  let rp = await prisma.photo.findFirst({ where: { userId: u.id, slot: 0 } });
  if (!rp) {
    rp = await prisma.photo.create({
      data: {
        userId: u.id,
        storageKey: await writePlaceholder(),
        mimeType: "image/png",
        slot: 0,
        status: "active",
        isActive: true,
      },
    });
  }

  // 評分者評主角（女性、年輕族群略給高分，製造分眾差異）
  const base = 7 + (g === "female" ? 0.8 : 0) + (a === "18-24" ? 0.5 : 0);
  const score = Math.max(1, Math.min(10, Math.round(base + (Math.random() * 2 - 1))));
  await prisma.rating.upsert({
    where: { raterId_photoId: { raterId: u.id, photoId: heroPhoto.id } },
    update: {},
    create: {
      raterId: u.id,
      photoId: heroPhoto.id,
      score,
      raterGender: g,
      raterAgeRange: a,
      raterRegion: reg,
    },
  });

  // 主角評前 12 位評分者 → 解鎖查看資格
  if (i < 12) {
    await prisma.rating.upsert({
      where: { raterId_photoId: { raterId: hero.id, photoId: rp.id } },
      update: {},
      create: {
        raterId: hero.id,
        photoId: rp.id,
        score: 6 + Math.floor(Math.random() * 4),
        raterGender: hero.gender,
        raterAgeRange: hero.ageRange,
        raterRegion: hero.region,
      },
    });
  }
}

// ── 產生主角的揭曉結果 ──
const ratings = await prisma.rating.findMany({
  where: { photoId: heroPhoto.id, isUnevaluable: false, score: { not: null } },
  select: { score: true, raterGender: true, raterAgeRange: true, raterRegion: true },
});
const scores = ratings.map((r) => r.score);
const avgScore = round1(avg(scores));
// 用一組模擬的全站分布來計算百分位
const population = [5.4, 5.9, 6.1, 6.4, 6.7, 6.9, 7.1, 7.3, 7.6, 7.9, 8.2, 8.5];
const percentileRank = Math.round(
  (population.filter((v) => v <= avgScore).length / (population.length + 1)) * 100,
);
const confidence = scores.length < 15 ? "low" : scores.length < 50 ? "medium" : "high";

await prisma.resultBatch.create({
  data: {
    photoId: heroPhoto.id,
    totalRatings: scores.length,
    averageScore: avgScore,
    percentileRank,
    confidence,
    byGender: JSON.stringify(breakdown(ratings, "raterGender", "gender", GENDER_LABELS)),
    byAge: JSON.stringify(breakdown(ratings, "raterAgeRange", "age", AGE_LABELS)),
    byRegion: JSON.stringify(breakdown(ratings, "raterRegion", "region", REGION_LABELS)),
  },
});

console.log(
  `Seed done. 登入 demo@jifen.app（開發登入）即可查看結果。` +
    ` 主角平均 ${avgScore}、百分位 ${percentileRank}%、樣本 ${scores.length}。`,
);

await prisma.$disconnect();
