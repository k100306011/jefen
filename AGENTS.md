<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 幾分（jifen）— 接手前必讀

**接手這個專案，動手前先讀 `docs/` 裡的三份文件：**

| 文件 | 內容 |
|---|---|
| [docs/PRODUCT.md](docs/PRODUCT.md) | 初衷、設計原則、使用者故事、業務規則、**冷啟動經濟學**、Non-goals |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 技術架構、資料模型、關鍵流程、**已知陷阱**、驗證狀態 |
| [docs/LAUNCH.md](docs/LAUNCH.md) | 上線目標、阻塞項、逐步上線步驟、最終檢查清單 |

## 溝通與工作方式

- 一律用**繁體中文（台灣用語）**回覆。
- 這是一個**要上線給真人使用**的服務，不是練習專案。「建置通過」不等於「能用」——
  請實際跑起來驗證（`node scripts/e2e.mjs`、真的打 API、查資料庫），並如實回報哪些沒驗到。
- 修改後請跑 `npm run build`、`npm run lint`、`node scripts/e2e.mjs`。

## 三條不能破壞的底線

這三項都曾經是實際存在的嚴重漏洞，修好後有實測驗證，**不要為了「簡化」而改回去**：

1. **審核 fail-closed**（`src/lib/moderation.ts`）：審核服務不可用時**絕不放行**，一律轉 `pending_review`。
2. **揭曉冪等**（`src/lib/reveal.ts`）：沒有新評分就不產生新批次，靠 `Rating.countedBatchId` 標記。
3. **k-匿名**（`src/lib/scoring.ts`）：分眾小組 `sampleSize < MIN_BUCKET_SAMPLE` 不輸出。

以及：**介面上的數字與標籤必須與實際計算一致**（不捏造社會證明、不寫「贏過同齡」但算的是全站）。
