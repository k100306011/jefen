# 幾分 — 技術架構與接手手冊

> 產品脈絡看 [PRODUCT.md](./PRODUCT.md)，上線步驟看 [LAUNCH.md](./LAUNCH.md)。
> ⚠️ **本專案使用 Next.js 16，與多數模型的訓練資料不同。動手前請讀 `node_modules/next/dist/docs/` 內的對應文件**（見 `AGENTS.md`）。

---

## 技術棧

| 層 | 選型 | 備註 |
|---|---|---|
| 框架 | **Next.js 16.2.6**（App Router + Turbopack） | middleware 改叫 **`src/proxy.ts`** |
| UI | React 19.2、Tailwind CSS v4、framer-motion | 設計 token 在 `globals.css` 的 `@theme` |
| 認證 | **next-auth v5 beta**（JWT session） | split config：`auth.config.ts` 給 proxy 用（不含 Prisma） |
| 資料庫 | **Prisma 7 + SQLite**（better-sqlite3 driver adapter） | 單檔資料庫，零維護 |
| 排程 | **node-cron**（`src/instrumentation.ts`） | 每晚 21:00，免設系統 cron |
| 圖片審核 | Gemini 2.0 Flash | 可選；未設定時 fail-closed（見下） |
| 部署 | Docker Compose + Cloudflare Tunnel | VM 零開放端口 |

---

## 路由總覽

```
公開
  /                     落地頁（ISR revalidate=300）
  /auth/signin          登入（Google；dev 模式另有 email 直登）
  /privacy /terms       法律頁（(legal) route group）
  /sitemap.xml /robots.txt /manifest.webmanifest
  /opengraph-image /apple-icon /icon.svg   品牌圖（next/og 動態生成）

需登入
  /onboarding           首次填分眾資料。⚠️ 不在 (app) group，由頁面自身守門
                        （未登入→/auth/signin；已 onboard→/dashboard）

需登入（proxy.ts 守門 + (app)/layout.tsx 二次守門，未填分眾資料會被導去 /onboarding）
  /dashboard            總覽
  /rate                 評分（核心迴圈）
  /results              我的結果
  /upload               我的照片
  /settings             設定 / 刪帳號

API
  /api/auth/[...nextauth]   next-auth
  /api/photos/[id]          GET，需登入，回傳圖片 bytes
  /api/stats                GET，公開，全站統計
  /api/healthz              GET，公開，DB 探針（Docker healthcheck 用）
  /api/cron/reveal          POST/GET，需 CRON_SECRET（僅 Authorization 標頭）
```

Server Actions（全部在 `src/lib/actions.ts`，**每個都驗證 session**）：
`completeOnboarding`、`uploadPhoto`、`submitRating`、`reportPhoto`、`updateProfile`、`deletePhoto`、`deleteAccount`

其中**只有 4 個另有 rate limit**：`uploadPhoto`／`submitRating`／`reportPhoto`／`updateProfile`。
`completeOnboarding`、`deletePhoto`、`deleteAccount` 目前**無限流**。

---

## 資料模型

```
User ──┬─< Photo ──┬─< Rating          （評分者的分眾屬性以快照存於 Rating）
       │           ├─< ResultBatch     （每次揭曉的結果快照，JSON 字串存分眾）
       │           └─< PhotoReport
       ├─< Rating  (raterId, "RatingsGiven")
       └─< PhotoReport (reporterId, "ReportsMade")

+ next-auth 標準表：Account / Session / VerificationToken
```

關鍵欄位：

- `Photo.status`：`pending_review` | `active` | `rejected` | `flagged`
- `Photo.isActive`：**只有 `isActive=true AND status='active'` 才會進評分池**（兩個條件都要）
- `Photo.slot`：`0`=主照片，`1`=對比照
- `Rating.raterGender/raterAgeRange/raterRegion`：評分當下的**快照**，之後使用者改資料不影響歷史聚合
- `Rating.countedBatchId`：該評分已被哪個批次計入。**這是揭曉冪等性的關鍵**（見下）
- `Rating` 有 `@@unique([raterId, photoId])`：同一人不能重複評同一張
- `PhotoReport` 有 `@@unique([reporterId, photoId])`：同一人不能重複檢舉同一張
- `ResultBatch.byGender/byAge/byRegion`：SQLite 無陣列型別，以 **JSON 字串**存 `DemographicBreakdown[]`

---

## 關鍵流程

### 1. 認證
- 正式環境：只有 Google OAuth。
- 開發環境：另註冊一個 `Credentials` provider（id=`dev`），任意 email 直登。
  **這個 provider 由 `src/lib/auth.ts` 的 `NODE_ENV !== "production"` 在 provider 層擋掉**，不只是隱藏 UI。已實測正式模式下登入頁完全沒有該表單。
- Session 用 **JWT**（`proxy.ts` 守門不必查 DB），但使用者/帳號仍由 Prisma adapter 落地。

### 2. 上傳 + 審核（安全關鍵）
```
檔案驗證（MIME 白名單 / 8MB 上限）
   ↓
moderatePhoto()
   ├─ 明確違規 (passed=false)          → 直接拒絕，檔案不落地
   ├─ 無法判定 (requiresManualReview)  → 存檔，但 status=pending_review, isActive=false
   └─ 通過                              → status=active, isActive=true，進評分池
```

**`requiresManualReview` 的觸發條件（`src/lib/moderation.ts`）：**
- 正式環境 **且**（沒設 `GEMINI_API_KEY`／值是 `placeholder`／API 呼叫失敗／回傳格式不合法）

> ⚠️ **這是刻意的 fail-closed 設計，不要「簡化」掉。**
> 舊版程式在沒有 key 時直接 `return {passed:true}`，導致正式環境**完全沒有審核**——任何裸露、未成年、盜用他人的照片都會直接進入所有人看得到的評分池。已用編譯後的真實模組實測 4 種情境確認修復。
> 開發環境維持直接通過，是為了本機測試方便。

### 3. 評分
- 佇列：`getRatingQueue` 取**他人的** active 照片，排除已評過的，`被評次數最少的優先`（讓評分平均分佈）
- 解鎖：`getRatingProgress` 數該使用者給出的評分總數 ≥ 10
- 重複評分：DB unique 約束擋下，action 吞掉錯誤視為成功（不讓使用者卡住）

### 4. 揭曉（`src/lib/reveal.ts`）
```
挑出 active 且有效評分數 ≥ MIN_RATINGS_FOR_BATCH 的照片
   ↓
population = 這些照片的平均分（百分位的比較基準，全站不分齡）
   ↓
對每張照片：
   若「沒有 countedBatchId=null 的新評分」→ 跳過（不產生重複快照）
   否則 → 用「全部」有效評分算累積結果，建立 ResultBatch
        → 把那些新評分標記 countedBatchId = 該批次 id
```

> ⚠️ **冪等性是刻意的。** 舊版每次執行都無條件建立新批次，實測連打 3 次就生出 3 筆一模一樣的快照（`n=30, avg=7.6, pct=100`），會把趨勢圖灌成一條同日期重複點的爛平線，且資料庫無限膨脹。`countedBatchId` 這個欄位當初在 schema 裡但**從沒被使用**，現在才真正發揮作用。

**補跑**：`revealIfMissed()` 在伺服器啟動時檢查「最近一次該揭曉的時間之後有沒有批次」，沒有就補跑一次（容器在 21:00 沒開機的情況）。因為 `revealAll` 冪等，補跑安全。

### 5. 檢舉（`reportPhoto`）
一筆檢舉 → 立即 `status='flagged'`, `isActive=false` → 該照片從所有人的佇列消失。
**刻意選擇「一次即下架」而非「N 次才下架」**：寧可誤下架一張，也不要多留一秒可能的受害者照片。副作用是可能被惡意使用者用來騷擾——這需要後台複審來平衡（**目前還沒有後台**）。

---

## 已知陷阱（都是踩過的）

| 陷阱 | 說明 |
|---|---|
| **Prisma generator 不能改** | `schema.prisma` 的 generator 必須維持 `prisma-client-js` 且**不要加 output**，才能生成回 `node_modules/.prisma/client` 讓 Turbopack 解析到 |
| **改 schema 後要 `prisma generate`** | `migrate dev` 不一定會自動重生 client，會出現 `Property 'photoReport' does not exist` 這種型別錯誤 |
| **`serverExternalPackages`** | `next.config.ts` 必須保留 Prisma / better-sqlite3 那幾個，否則 runtime 找不到模組 |
| **`assets/` 不能刪** | **OG 圖**（`opengraph-image.tsx`，唯一讀 `assets/` 的地方）用 `next/og` 生成，satori 預設字型**不含中文**。`assets/NotoSansTC-*.ttf` 是內嵌字型子集，建置時讀取，刪掉會變豆腐框。（apple-icon 只畫 logo 不含文字，不受影響） |
| **`NEXT_PUBLIC_SITE_URL` 走 build arg** | `.dockerignore` 排除 `.env.*`，所以它**不是**從 `.env.production` 讀的，而是 `docker-compose.yml` 的 `build.args`（讀 shell 環境變數）。換網域要 `NEXT_PUBLIC_SITE_URL=https://新網域 docker compose up -d --build`，否則會靜默退回 `src/lib/site.ts` 的預設值 |
| **volume 名稱有前綴** | compose 宣告 `jifen-data`，實際建立的是 **`jifen_jifen-data`**。備份指令用錯名稱會建出空 volume 而不是備份到資料 |
| **落地頁是 ISR** | `revalidate = 300`。Docker build 階段沒有 DB，`getSiteStats` 有 try/catch 回傳 0（徽章隱藏），執行期 ISR 再生才顯示真實數字。**若在有資料的機器上 build，會把當下數字烤進靜態 HTML** |
| **`globals.css` 的 spacing 警告** | 不要定義具名 `--spacing-xs/sm/md`，會讓 `max-w-*` 塌縮成直書 |
| **dev 模式首次進頁面會慢** | Turbopack 即時編譯，e2e 若在冷啟動時跑會因 hydration 未完成而誤判失敗。先 `curl` 預熱該頁 |
| **CRON_SECRET 只收標頭** | 已移除 `?key=` 查詢字串支援（會洩漏進 access log／瀏覽器歷史），改用 timing-safe 比較 |

---

## 安全措施現況

✅ 已有：
- 安全標頭（HSTS / nosniff / X-Frame-Options / Referrer-Policy / Permissions-Policy），`poweredByHeader: false`
- `storage.ts` 用 `path.basename()` 防目錄穿越
- 所有 Server Action 驗證 session；`deletePhoto` 驗證 ownership
- Rate limiting（`src/lib/rate-limit.ts`，記憶體滑動視窗）：上傳 10/時、評分 120/分、檢舉 20/時、資料更新 30/時
- k-匿名：分眾小組 `sampleSize < 3` 不輸出

⚠️ 已知限制：
- **Rate limit 是行程內記憶體** — 單機部署夠用，若改多實例需換 Redis
- **`/api/photos/[id]` 只驗「有沒有登入」**，不驗這張照片是否還在池中。任何登入者拿到 id 就能一直讀取（cuid 不易猜，但看過的人可永久保存 URL）
- **年齡是自我聲明的勾選框**，沒有實質驗證
- **刪帳號會 cascade 掉他給別人的評分**，可能讓別人的照片掉到 `MIN_RATINGS_FOR_BATCH` 以下

---

## 常用指令

```bash
npm run dev            # 本機開發（預設 3000，本專案習慣用 3005）
npm run build          # 正式建置
npm run start          # 正式啟動
npm run lint
npm run db:migrate     # 開發：建立/套用 migration
npm run db:deploy      # 正式：只套用既有 migration
npm run db:generate    # 改 schema 後必跑
npm run db:seed        # demo 資料
npm run db:studio      # 視覺化檢視資料

node scripts/e2e.mjs   # 真實 Chrome 走完整旅程（需 dev server 在 3005）
```

`scripts/e2e.mjs` 涵蓋 10 步：登入→onboarding→上傳→評分解鎖→設定→結果→API（含 cron 授權）→刪照片→刪帳號。**改完核心流程請務必跑一次。**

---

## 目前驗證狀態（2026-08-07）

- ✅ `npm run build` + `npm run lint` 全綠
- ✅ e2e 10/10 通過
- ✅ 全新 volume `prisma migrate deploy` 正確建立全部表格（含 `PhotoReport`、`countedBatchId`）
- ✅ 揭曉冪等性實測（連打 3 次只產生 1 筆）
- ✅ 檢舉下架實測（兩個真人帳號跑過）
- ✅ 審核 fail-closed 實測（4 種環境情境）
- ✅ 正式模式實測：dev 登入表單消失、cron 註冊、補跑執行
- ❌ **Docker 映像未實測** —— 開發沙盒連不到 Docker Hub。第一次 `docker compose up -d --build` 要盯著看
