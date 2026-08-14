import "server-only";

// 極簡的記憶體滑動視窗限流。
// 本服務是單一容器部署（見 docker-compose.yml），因此行程內計數即足夠；
// 若日後擴成多實例，需改用 Redis 之類的共享儲存。

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// 定期清掉過期的 key，避免長時間執行後記憶體無限成長。
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSec: number;
}

/**
 * @param key    識別字串（建議 `${action}:${userId}`）
 * @param limit  視窗內允許的次數
 * @param windowSec 視窗長度（秒）
 */
export function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { ok: true, retryAfterSec: 0 };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

// ── 各動作的額度（保守但不影響正常使用）──
export const LIMITS = {
  upload: { limit: 10, windowSec: 3600 }, // 每小時 10 次上傳
  rating: { limit: 120, windowSec: 60 }, // 每分鐘 120 次評分（正常手動速度遠低於此）
  report: { limit: 20, windowSec: 3600 }, // 每小時 20 次檢舉
  profile: { limit: 30, windowSec: 3600 }, // 每小時 30 次資料更新
} as const;
