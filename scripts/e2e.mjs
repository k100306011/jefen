// 幾分 — 端到端流程測試（真實瀏覽器，走完整使用者旅程）
// 用法：node scripts/e2e.mjs   （需 dev server 跑在 BASE，預設 http://localhost:3005）
import puppeteer from "puppeteer-core";
import { writeFileSync, mkdirSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = process.env.BASE || "http://localhost:3005";
const OUT = "/tmp/e2e-shots";
mkdirSync(OUT, { recursive: true });

// 測試用 1x1 PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
writeFileSync("/tmp/e2e-photo.png", PNG);

const EMAIL = `e2e-${Date.now()}@test.local`;
let step = 0;
const pass = (msg) => console.log(`  ✓ [${++step}] ${msg}`);
const fail = (msg) => {
  console.error(`  ✗ FAIL: ${msg}`);
  process.exitCode = 1;
  throw new Error(msg);
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  protocolTimeout: 120000,
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickByText(selector, text, { retries = 3 } = {}) {
  for (let i = 0; i < retries; i++) {
    const ok = await page.evaluate(
      (sel, t) => {
        const els = [...document.querySelectorAll(sel)];
        const el = els.find((e) => e.textContent?.trim() === t);
        if (el) {
          el.click();
          return true;
        }
        return false;
      },
      selector,
      text,
    );
    if (ok) return;
    await sleep(800);
  }
  const buttons = await page.evaluate(
    (sel) =>
      [...document.querySelectorAll(sel)]
        .map((e) => e.textContent?.trim())
        .slice(0, 20),
    selector,
  );
  fail(`找不到可點擊的「${text}」（${selector}）；現有：${JSON.stringify(buttons)}`);
}

async function waitForText(text, timeout = 15000) {
  try {
    await page.waitForFunction(
      (t) => document.body.innerText.includes(t),
      { timeout },
      text,
    );
  } catch {
    fail(`等不到畫面出現「${text}」（目前網址 ${page.url()}）`);
  }
}

async function shot(name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
}

console.log(`E2E 開始（${EMAIL}）→ ${BASE}`);

// 1. Dev 登入（新使用者）— 等 hydration 完成，失敗自動重試
let loggedIn = false;
for (let attempt = 0; attempt < 3 && !loggedIn; attempt++) {
  await page.goto(`${BASE}/auth/signin`, { waitUntil: "networkidle2" });
  await waitForText("開發測試登入");
  await sleep(1200); // 等 hydration
  await page.click('input[placeholder="dev@example.com"]', { clickCount: 3 });
  await page.type('input[placeholder="dev@example.com"]', EMAIL);
  await clickByText("button", "登入");
  try {
    await page.waitForFunction(
      () => !location.pathname.startsWith("/auth/signin"),
      { timeout: 15000 },
    );
    loggedIn = true;
  } catch {
    console.log(`  … 登入重試（第 ${attempt + 1} 次未跳轉）`);
  }
}
if (!loggedIn) fail("dev 登入失敗（3 次未跳轉）");
await sleep(1000);
pass(`dev 登入 ${EMAIL}`);

// 2. 新用戶會被導到 onboarding
if (!page.url().includes("/onboarding")) {
  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  await sleep(1200);
}
await waitForText("建立你的檔案");
pass("導向 onboarding");

// 3. 完成 onboarding
await clickByText("button", "男生");
await clickByText("button", "25–30 歲");
await clickByText("button", "台北");
await page.click('input[name="verify18"]');
await clickByText("button", "完成，開始");
await waitForText("上傳第一張照片", 20000);
pass("onboarding 完成 → 導向上傳頁");

// 4. 上傳照片
const fileInput = await page.$('input[type="file"]');
await fileInput.uploadFile("/tmp/e2e-photo.png");
await sleep(400);
await clickByText("button", "上傳照片");
await page.waitForFunction(
  () => !!document.querySelector('img[src^="/api/photos/"]'),
  { timeout: 20000 },
).catch(() => fail("上傳後未出現照片"));
await shot("after-upload");
pass("照片上傳成功（審核通過、寫入 DB、授權路由可讀）");

// 5. 評分 10 次解鎖
await page.goto(`${BASE}/rate`, { waitUntil: "domcontentloaded" });
await waitForText("憑第一眼直覺");
// 持續點「7」直到顯示已解鎖（點擊可能落在按鈕 disabled 期間，需重試）
let unlocked = false;
for (let i = 0; i < 40 && !unlocked; i++) {
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === "7" && !b.disabled,
    );
    btn?.click();
  });
  await sleep(500);
  unlocked = await page.evaluate(() =>
    document.body.innerText.includes("已解鎖"),
  );
}
if (!unlocked) fail("評滿 10 人後未顯示已解鎖");
await shot("after-rating");
pass("評分 10 次 → 解鎖查看資格");

// 6. 設定頁：改暱稱＋儲存
await page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" });
await waitForText("設定");
await page.evaluate(() => {
  const input = document.querySelector("#name");
  input.value = "";
});
await page.type("#name", "E2E 測試員");
await clickByText("button", "儲存變更");
await waitForText("已儲存");
pass("設定頁更新個人資料");

// 7. 結果頁（已解鎖、照片評分中）
await page.goto(`${BASE}/results`, { waitUntil: "domcontentloaded" });
await waitForText("我的結果");
await shot("results");
pass("結果頁正常渲染");

// 8. API 驗證（stats / healthz / cron reveal）
const api = await page.evaluate(async () => {
  const stats = await fetch("/api/stats").then((r) => r.json());
  const health = await fetch("/api/healthz").then((r) => r.json());
  const cronNoAuth = await fetch("/api/cron/reveal", { method: "POST" }).then((r) => r.status);
  // 密鑰只接受 Authorization 標頭（查詢字串會洩漏進紀錄檔）
  const cronQueryString = await fetch("/api/cron/reveal?key=dev-cron-secret", {
    method: "POST",
  }).then((r) => r.status);
  const cron = await fetch("/api/cron/reveal", {
    method: "POST",
    headers: { Authorization: "Bearer dev-cron-secret" },
  }).then((r) => (r.ok ? r.json() : { failed: r.status }));
  return { stats, health, cronNoAuth, cronQueryString, cron };
});
if (!api.health.ok) fail("healthz 失敗");
if (typeof api.stats.photosInPool !== "number") fail("stats 格式錯誤");
if (api.cronNoAuth !== 401) fail(`cron 未帶密鑰應 401，實際 ${api.cronNoAuth}`);
if (api.cronQueryString !== 401)
  fail(`cron 用 ?key= 查詢字串應被拒（401），實際 ${api.cronQueryString}`);
if (!api.cron.ok) fail(`cron 揭曉失敗：${JSON.stringify(api.cron)}`);
pass(
  `API 全通過：stats(pool=${api.stats.photosInPool}) healthz cron(未授權=401, ?key=401, 揭曉 ${api.cron.revealedPhotos} 張)`,
);

// 9. 揭曉後結果頁應出現分眾結果（本帳號照片已被 seed？不一定 — 檢查 demo 帳號邏輯改為：確認資料庫有新批次即可，由 cron 回傳驗證）

// 10. 刪除照片
await page.goto(`${BASE}/upload`, { waitUntil: "domcontentloaded" });
await waitForText("你的照片");
await clickByText("button", "刪除");
await sleep(300);
await clickByText("button", "確定刪除？");
await page.waitForFunction(
  () => !document.querySelector('img[src^="/api/photos/"]'),
  { timeout: 15000 },
).catch(() => fail("刪除後照片仍存在"));
pass("刪除照片成功");

// 11. 刪除帳號
await page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" });
await waitForText("刪除帳號");
await page.type('input[name="confirm"]', "DELETE");
await clickByText("button", "永久刪除");
await sleep(3000);
const backToLanding = await page.evaluate(() =>
  document.body.innerText.includes("真人眼中的你"),
);
if (!backToLanding) fail(`刪除帳號後未回到落地頁（${page.url()}）`);
pass("刪除帳號 → 登出 → 回落地頁");

await browser.close();
console.log(`\n全部 ${step} 步通過 ✅（截圖在 ${OUT}）`);
