# 幾分（jifen）

真人互評外貌分數的網頁應用。上傳照片、互相評分，看自己在**不同性別／年齡／地區眼中**的分眾定位、百分位，以及前後對比的成長。

> 核心玩法：上傳照片 → 幫別人評分（1:1 互惠，評 10 人解鎖）→ 每晚 21:00 揭曉你的分眾結果 → 上傳對比照看成長。

## 技術棧

- **Next.js 16**（App Router、Turbopack）+ **React 19**
- **next-auth v5**（Google OAuth；開發環境另有 email 直登）
- **Prisma 7 + SQLite**（`better-sqlite3` driver adapter，零維護單檔資料庫）
- **Tailwind CSS v4**、**framer-motion**
- **node-cron**（每晚 21:00 自動揭曉，免設定系統 cron）

## 本機開發

```bash
npm install --legacy-peer-deps
cp .env.example .env.local        # dev 下多數可留預設；AUTH_SECRET 建議自行產生
npm run db:migrate                # 建立 SQLite 資料庫並套用 schema
npm run db:seed                   # （選用）建立 demo 資料
npm run dev
```

開發模式的登入頁會出現「開發測試登入」，可用任意 email 直接登入（例如執行過 seed 後，用 `demo@jifen.app` 登入即可看到完整分眾結果）。

## 環境變數

| 變數 | 必填 | 說明 |
| --- | --- | --- |
| `AUTH_SECRET` | 正式環境必填 | next-auth 加密金鑰，`openssl rand -base64 32` |
| `AUTH_URL` | 建議 | 正式網址，供 OAuth 回呼，例 `https://jifen.example.com` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | 正式環境必填 | Google OAuth；回呼網址設為 `<AUTH_URL>/api/auth/callback/google` |
| `CRON_SECRET` | 選填 | 外部排程器觸發 `/api/cron/reveal` 用；內建排程不需要 |
| `GEMINI_API_KEY` | 選填 | 圖片審核；未設定時開發環境會略過審核 |
| `DATABASE_URL` | 有預設 | SQLite 位置，預設 `file:./data/jifen.db`（Docker 為 `file:/app/data/jifen.db`） |
| `DATA_DIR` | 有預設 | 上傳圖片目錄，預設 `./data` |
| `TZ` | 有預設 | 排程時區，預設 `Asia/Taipei` |

## Docker 部署（自架機器一鍵啟動）

```bash
cp .env.example .env.production   # 填入 AUTH_SECRET / GOOGLE_* / AUTH_URL 等
docker compose up -d --build
```

- 服務監聽 `:3000`。
- SQLite 資料庫與上傳圖片持久化於 named volume **`jifen-data`**（`/app/data`）。
- 容器啟動時會自動執行 `prisma migrate deploy` 套用資料庫遷移。
- 內建 node-cron 於**每晚 21:00（Asia/Taipei）自動揭曉**，無需任何額外設定。

更新版本：`git pull && docker compose up -d --build`。

## 自動化揭曉

- **內建排程**：`src/instrumentation.ts` 在伺服器啟動時註冊 node-cron，每晚 21:00 呼叫 `revealAll()`，把當天累積的評分聚合成新的結果快照。
- **外部觸發（選用）**：設定 `CRON_SECRET` 後，可由外部排程器呼叫：

```bash
curl -X POST https://your-domain/api/cron/reveal \
  -H "Authorization: Bearer $CRON_SECRET"
```

## 常用指令

| 指令 | 說明 |
| --- | --- |
| `npm run dev` | 本機開發 |
| `npm run build` / `npm run start` | 正式建置 / 啟動 |
| `npm run db:migrate` | 開發環境建立 / 更新資料庫遷移 |
| `npm run db:deploy` | 套用既有遷移（正式環境） |
| `npm run db:seed` | 建立 demo 資料 |
| `npm run db:studio` | 開啟 Prisma Studio 檢視資料 |

## API 一覽

| 端點 | 方法 | 授權 | 說明 |
| --- | --- | --- | --- |
| `/api/auth/*` | GET/POST | — | next-auth（Google OAuth / dev 登入） |
| `/api/photos/[id]` | GET | 登入 | 授權後提供上傳圖片 |
| `/api/cron/reveal` | GET/POST | `CRON_SECRET` | 手動 / 外部觸發揭曉 |
| `/api/stats` | GET | 公開 | 全站統計（照片池、評分數、用戶數） |
| `/api/healthz` | GET | 公開 | 健康檢查（DB 連線探針） |

Server Actions（皆驗證 session）：`completeOnboarding`、`uploadPhoto`、`submitRating`、`updateProfile`、`deletePhoto`、`deleteAccount`。

## 端到端測試

```bash
npm run dev            # 先啟動 dev server（port 3005 或改 BASE 環境變數）
node scripts/e2e.mjs   # 真實 Chrome 走完整旅程：登入→onboarding→上傳→評分解鎖→設定→API→刪照片→刪帳號
```

## 專案結構（重點）

```
src/
  app/
    (app)/                受保護頁面：dashboard / rate / results / upload / settings（共用守門 layout）
    onboarding/           首次填寫分眾資料
    auth/signin/          登入頁
    api/
      auth/[...nextauth]/ next-auth
      cron/reveal/        受 CRON_SECRET 保護的揭曉觸發
      photos/[id]/        授權後提供上傳圖片
      healthz/            健康檢查
  components/app/         核心互動元件（評分、上傳、結果卡…）
  lib/
    auth.ts / auth.config.ts   認證（split config）
    db.ts                 Prisma client（adapter）
    actions.ts            Server Actions（onboarding / 上傳 / 評分）
    queries.ts            讀取查詢
    scoring.ts            聚合計分純函式
    reveal.ts             揭曉邏輯
    storage.ts            本機圖片儲存
  instrumentation.ts      啟動時註冊每晚排程
  proxy.ts                認證守門（Next 16 的 middleware）
prisma/
  schema.prisma          資料模型
  seed.mjs               demo 種子
```
