# 接手提示詞

給新的 Claude Code session 用。直接複製貼上，把「這次要做的」換成當下任務。

---

## 主要接手提示詞（同一台機器 / 已有 repo）

```
這是「幾分」(jifen) 專案 —— 一個要上線給真人使用的真人互評外貌評分服務，網域 jifen.space。

動手前先讀完 docs/ 這四份（AGENTS.md 也會指向它們）：
- docs/LAUNCH.md ← 先讀開頭的「交接狀態」，知道現在做到哪
- docs/PRODUCT.md — 初衷、設計原則、使用者故事、冷啟動經濟學、Non-goals
- docs/ARCHITECTURE.md — 架構、資料模型、關鍵流程、已知陷阱
- docs/DESIGN-REFERENCE.md — 已暫緩，不要據此改配色

這次要做的：<填入任務>

規則：
1. 一律用繁體中文（台灣用語）回覆。
2. 這是要上線給陌生人上傳自己臉部照片的服務，「build 通過」不等於「能用」。
   改完要實際驗證：npm run build、npm run lint、node scripts/e2e.mjs
   （e2e 需先 npm run dev 跑在 3005，且先 curl 預熱頁面避免 dev 冷編譯造成 hydration flake）。
   必要時直接查 SQLite 確認資料狀態。如實回報哪些沒驗到，不要含糊帶過。
3. 有四條不能為了「簡化」而改回去的底線（詳見 AGENTS.md）：
   審核 fail-closed、揭曉冪等、分眾 k-匿名、介面數字必須與實際計算一致。
4. Next.js 16 與你的訓練資料差異大，寫程式前先讀 node_modules/next/dist/docs/ 的對應文件。
5. 產品規則（解鎖門檻等 constants）與視覺改版屬產品決策，先問我，不要自己改。
6. 能修的先修完，再清楚列出需要我本人處理的（申請 key、設定網域、產品決策）。
```

---

## 換機器時，先補這段

```
先 git clone git@github.com:k100306011/jefen.git，然後：
npm install --legacy-peer-deps
cp .env.example .env.local   # 填 AUTH_SECRET 即可本機開發
npm run db:migrate && npm run db:seed
npm run dev

注意：舊機器上的 Claude 記憶不會跟著過來，所有交接資訊都在 repo 的 docs/ 裡。
```

---

## 任務 A：做管理後台（建議的下一步）

```
這次要做的：實作 /admin 管理後台。這是目前唯一還沒寫的程式，
沒有它就無法處理使用者檢舉，也無法在沒有 Gemini key 時人工放行照片。

需求：
- 驗證方式：環境變數放管理員 email 白名單，比對 session 的 email 即可，
  不需要做多帳號權限系統
- 檢舉清單：顯示照片、檢舉原因、檢舉次數、時間 → 可「放行」或「永久移除」
- 待審清單：status='pending_review' 的照片 → 可「放行」或「拒絕」
- 永久移除要一併刪掉磁碟上的檔案（見 lib/storage.ts 的 deletePhotoFile）
- /admin 要加進 robots.ts 的 disallow，也要在 proxy.ts 守門

做完請實際用兩個帳號測一次：A 上傳 → B 檢舉 → 後台看得到 → 放行後照片回到評分池。
```

## 任務 B：上線

```
這次要做的：依 docs/LAUNCH.md 的 S1–S9 把服務上線。

我會自己操作機器與外部設定（Cloudflare、Google Console、申請 key），
你負責指引每一步、檢查設定是否正確、並在出錯時判讀 log。

特別注意 docs/ARCHITECTURE.md「已知陷阱」裡的四個部署地雷：
volume 實際名稱有前綴、NEXT_PUBLIC_SITE_URL 走 build arg、
容器需要 sqlite3、.env.example 必須在 git 裡。

Docker 映像從來沒有實際建置過，第一次 build 要一起盯 log。
```

---

## ⚠️ 貼提示詞時注意

- **不要把 API key、client secret、tunnel token 貼進對話或截圖**。曾經有一把 Gemini key 因為截圖而外洩。要給值就說「我已經填進 .env.production 了」。
- `.env.production` 有真實機密且已被 gitignore，**不要要求 AI 把它 commit 進 git**。
