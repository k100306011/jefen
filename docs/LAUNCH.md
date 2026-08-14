# 幾分 — 上線計畫

> 狀態日期：**2026-08-14**。產品脈絡看 [PRODUCT.md](./PRODUCT.md)，技術細節看 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 📌 交接狀態（接手先看這段）

**程式碼狀態：可上線。** 已 push 到 `main`，build／lint／e2e 全綠。

- ✅ **已完成**：核心流程（註冊→上傳→評分→解鎖→揭曉→刪帳號）、SEO 全套、法律頁、品牌識別、安全修復（審核 fail-closed／檢舉下架／揭曉冪等／k-匿名／rate limit／cron 加固）、部署修復
- ❌ **唯一還沒寫的程式**：`/admin` 管理後台（處理檢舉與待審照片）→ 見下方 **B4**
- 🛑 **視覺維持原狀**：`docs/DESIGN-REFERENCE.md` 那份參考**已暫緩、未採用**，請勿據此改配色
- ⚠️ **從未實測**：Docker 映像建置（開發環境連不到 Docker Hub）

**下一步優先序**：B4 管理後台 → B1 Gemini key → S1–S6 上線 → B5 種子使用者

---

## 上線目標（Evan 定義）

1. 使用者可以**註冊**
2. 使用者可以**上傳照片**
3. 網站**掛上網域**（jifen.space）且**能被搜尋到**
4. 使用者可以**真的評分別人、被別人評分**，且**站內收得到報告**
   - 4a. 使用者收到自己的**結果報告**（每晚 21:00 揭曉）
   - 4b. 營運者收到**檢舉通報**並能處理 ← **目前唯一完全沒做的東西**

---

## 現況一句話

**程式碼本身已經可以上線**（建置乾淨、完整旅程 e2e 10/10 通過、安全問題已修）。
還缺的是**外部憑證設定**（3 項）與**一個管理後台**（1 項）。

---

## 阻塞項

### 🔴 B1 — 沒有 Gemini API key，照片全部卡在待審核
**影響目標 2。** 現在的行為是 fail-closed：沒有有效 key → 每張上傳都變 `pending_review`、不進評分池。
服務會「看起來正常但沒有任何照片可評」。

**兩個解法（擇一）：**
- **A（推薦）**：到 https://aistudio.google.com/apikey 申請 key（免費額度足夠），填入 `.env.production` 的 `GEMINI_API_KEY`
- **B**：不用 AI 審核，改由人工複審 → **必須先做 B4 的管理後台**

> ⚠️ 曾經有一把 key 在截圖中外洩過，若那把還在使用請先 Delete 再重建。

### 🔴 B2 — 正式網域與 OAuth 尚未接通
**影響目標 1、3。**
- `.env.production` 的 **`AUTH_URL` 還是 `http://localhost:3001`**（本機 Docker 測試用），要改成 `https://jifen.space`。`NEXT_PUBLIC_SITE_URL` 已經是正式網域
- Google OAuth 同意畫面若還停在 **Testing／測試中**，只有測試使用者能登入，其他人會被擋 + 看到「未經驗證」警告
  → 要改成 **正式版／In production**。本專案只用 email + profile（非敏感範圍），**不需要 Google 審核**，按下去即生效
- 授權重新導向 URI 需含 `https://jifen.space/api/auth/callback/google`（截圖確認已加，記得按儲存）

### 🔴 B3 — Cloudflare Tunnel 尚未建立
**影響目標 3。** 沒有 tunnel，VM 上的服務無法對外。步驟見下方 S3。

### 🔴 B4 — 沒有管理後台
**影響目標 4b（以及 B1 的解法 B）。**
被檢舉的照片會停在 `flagged`、待審的停在 `pending_review`，**沒有任何介面可以處理**，只能手動下 SQL。
（`sqlite3` CLI 已加進 runner image，所以下面的指令在容器內可用。）

```bash
# 看待處理的檢舉
docker exec jifen sqlite3 /app/data/jifen.db \
  "SELECT r.createdAt, r.reason, r.photoId FROM PhotoReport r JOIN Photo p ON p.id=r.photoId WHERE p.status='flagged';"

# 看等待人工複審的照片（沒有 Gemini key 時全部會落在這裡）
docker exec jifen sqlite3 /app/data/jifen.db \
  "SELECT id, userId, createdAt FROM Photo WHERE status='pending_review';"

# 放行一張照片
docker exec jifen sqlite3 /app/data/jifen.db \
  "UPDATE Photo SET status='active', isActive=1, moderationReason=NULL WHERE id='<photoId>';"

# 永久移除（注意：只刪 DB 列，磁碟上的檔案要另外處理）
docker exec jifen sqlite3 /app/data/jifen.db \
  "DELETE FROM Photo WHERE id='<photoId>';"
```

**建議：上線前把這個後台做出來**（`/admin`，用 email 白名單驗證即可）。需求：
- 檢舉清單（照片、檢舉原因、次數、時間）→ 放行 / 永久移除
- `pending_review` 清單 → 放行 / 拒絕
- 不需要多帳號權限系統，單一管理員 email 比對就夠

### 🟠 B5 — 冷啟動：前 5 個使用者會卡住
**影響目標 4a。** 詳見 [PRODUCT.md 的冷啟動經濟學](./PRODUCT.md#冷啟動經濟學-️)。
需要**約 6 個認真參與的使用者**才會有第一個人看到結果。

**擇一**：
- **A（推薦）**：找 6–10 個朋友當種子，同一天一起註冊上傳互評
- **B**：暫時把 `src/lib/constants.ts` 的 `RATINGS_NEEDED_FOR_UNLOCK` 從 10 降到 3–5

---

## 上線步驟

### S1 — 把網域接到 Cloudflare
1. Cloudflare → **Add a site** → `jifen.space` → 選 Free
2. 到網域註冊商把 nameserver 改成 Cloudflare 給的兩個
3. 等 NS 生效（不生效的話 S3 選不到網域）

### S2 — 開 VM 並安裝 Docker
Oracle Always Free VM（或任何 VM）→ 安裝 Docker + Docker Compose → `git clone` 專案。
詳見 [../DEPLOY.md](../DEPLOY.md) 步驟 2–4。

> ⚠️ **clone 之前先確認這些檔案真的在 git 裡**（`.gitignore` 原本把 `.env.example` 一起擋掉了，已修）：
> `git ls-files .env.example scripts/setup-tunnel.sh` 兩個都要列得出來，否則 S4／S5 會找不到檔案。

### S3 — 建立 Cloudflare Tunnel
1. https://one.dash.cloudflare.com → **Networks → Tunnels → Create a tunnel**
2. 選 **Cloudflared** → 命名 `jifen` → Save
3. 「Install and run a connector」頁切到 **Docker** 分頁，指令裡 `--token` 後面那串 `eyJ...` **就是 TUNNEL_TOKEN**（不用執行該指令，只要複製）
4. 設 **Public Hostname**（不能漏）：
   - Subdomain：留空　Domain：`jifen.space`　Type：**HTTP**　URL：**`app:3000`**（docker service 名稱，不是 localhost）

### S4 — 填環境變數
```bash
cp .env.example .env.production   # 範本已在 git 裡
nano .env.production
```

```bash
AUTH_URL=https://jifen.space
NEXT_PUBLIC_SITE_URL=https://jifen.space
AUTH_SECRET=<openssl rand -base64 32 產生>
GOOGLE_CLIENT_ID=<Google Cloud Console>
GOOGLE_CLIENT_SECRET=<Google Cloud Console>
GEMINI_API_KEY=<新申請的 key>
CRON_SECRET=<openssl rand -hex 16>
# TUNNEL_TOKEN 留空即可 —— S5 的腳本會自動寫進來
```

> **`NEXT_PUBLIC_SITE_URL` 是建置期注入的**（影響 sitemap / OG 圖 / canonical）。
> `.dockerignore` 會排除 `.env.*`，所以它是透過 `docker-compose.yml` 的 **build arg** 傳進 Dockerfile，
> 而 compose 讀的是**你 shell 的環境變數**，不是 `.env.production`。換網域時要這樣建置：
> ```bash
> NEXT_PUBLIC_SITE_URL=https://新網域 docker compose up -d --build
> ```
> 沒傳的話會退回 `src/lib/site.ts` 的預設值 `https://jifen.space`。

### S5 — 啟動
```bash
./scripts/setup-tunnel.sh <TUNNEL_TOKEN>
```
這個腳本會把 token 寫進 `.env.production`（沒有該檔就先從 `.env.example` 複製），
再執行 `docker compose --profile tunnel up -d --build`，最後印出 `docker compose ps` 與 cloudflared 日誌。

驗證：
```bash
docker compose ps                          # app 要 healthy
docker compose logs cloudflared --tail 20  # 要看到 Registered tunnel connection
docker compose logs app | grep cron        # 要看到 nightly reveal scheduled
curl https://jifen.space/api/healthz        # {"ok":true,"db":"up"}
```

> ⚠️ **Docker 映像從未實際建置過**（開發沙盒連不到 Docker Hub），第一次要盯著 build log。

### S6 — 補 Google OAuth 正式設定
- 授權重新導向 URI 加 `https://jifen.space/api/auth/callback/google`
- 已授權的 JavaScript 來源加 `https://jifen.space`
- **OAuth 同意畫面改成「正式版」**（否則只有測試帳號能登入）
- 實測：用一個沒加進測試名單的 Google 帳號登入一次

### S7 — SEO 上線
程式端已完備（sitemap / robots / manifest / OG 圖 / JSON-LD / canonical），只剩外部登錄：
1. 確認 https://jifen.space/sitemap.xml 與 /robots.txt 回傳正確網域
2. [Google Search Console](https://search.google.com/search-console) 新增資源 → 用 Cloudflare DNS 驗證 → 提交 sitemap
3. 用 https://search.google.com/test/rich-results 檢查 JSON-LD
4. 用 Facebook / LINE 分享一次，確認 OG 圖正常（中文不能是豆腐框）

### S8 — 種子使用者
依 B5 擇一執行。**這步沒做，服務等於空轉。**

### S9 — 上線後例行
```bash
# 備份（目前完全沒有，強烈建議加 cron）
# ⚠️ volume 實際名稱有專案前綴，是 jifen_jifen-data（用 docker volume ls 確認）
mkdir -p backup
docker run --rm -v jifen_jifen-data:/data -v $PWD/backup:/backup \
  alpine tar czf /backup/jifen-$(date +%F).tar.gz -C /data .

# 看檢舉數量
docker exec jifen sqlite3 /app/data/jifen.db "SELECT COUNT(*) FROM PhotoReport;"
```

---

## 建議順序

```
S1 網域接 Cloudflare（要等 NS 生效，先做）
  ↓
B4 做管理後台          ← 可與 NS 等待時間並行
  ↓
B1 申請 Gemini key
  ↓
S2 VM + Docker → S3 Tunnel → S4 環境變數 → S5 啟動
  ↓
S6 OAuth 正式版 → 實測註冊 / 上傳 / 評分
  ↓
S7 Search Console → S8 種子使用者 → 對外開放
```

---

## 上線前最終檢查

- [ ] 用**別人的** Google 帳號能註冊成功（驗證 OAuth 同意畫面已發布）
- [ ] 上傳照片後狀態變「評分中」（不是「審核中」→ 代表 Gemini key 有效）
- [ ] 兩個帳號能互相評分
- [ ] 檢舉一張照片 → 它從佇列消失 → **後台看得到這筆檢舉**
- [ ] 手動觸發揭曉 → 結果頁出現分眾資料
  ```bash
  curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://jifen.space/api/cron/reveal
  ```
- [ ] https://jifen.space/sitemap.xml 顯示正式網域
- [ ] 分享連結到 LINE，OG 圖中文正常
- [ ] `/privacy` 與 `/terms` 打得開
- [ ] 備份指令跑過一次且檔案存在
