import { REVEAL_CRON } from "@/lib/constants";

// Next.js 在每個 server instance 啟動時呼叫一次 register()。
// 我們在此註冊每晚 21:00 的揭曉排程，讓 `next start` 一跑就全自動運作，免設定系統 cron。
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // 預設正式環境啟用；開發時可用 ENABLE_CRON=true 開啟。
  const enabled =
    process.env.NODE_ENV === "production" || process.env.ENABLE_CRON === "true";
  if (!enabled) return;

  // 防止 HMR / 多次呼叫重複註冊
  const g = globalThis as unknown as { __jifenCronStarted?: boolean };
  if (g.__jifenCronStarted) return;
  g.__jifenCronStarted = true;

  const { schedule } = await import("node-cron");
  const timezone = process.env.TZ || "Asia/Taipei";

  schedule(
    REVEAL_CRON,
    async () => {
      try {
        const { revealAll } = await import("@/lib/reveal");
        const summary = await revealAll();
        console.log("[cron] nightly reveal done:", summary);
      } catch (err) {
        console.error("[cron] nightly reveal failed:", err);
      }
    },
    { name: "jifen-nightly-reveal", timezone },
  );

  console.log(`[cron] nightly reveal scheduled (${REVEAL_CRON}, tz=${timezone})`);
}
