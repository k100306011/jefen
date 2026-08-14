import type { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { revealAll } from "@/lib/reveal";

export const dynamic = "force-dynamic";

// 受 CRON_SECRET 保護的揭曉觸發端點，可供外部排程器（系統 cron / Cloud Scheduler）呼叫。
// 內建的 node-cron（instrumentation.ts）會直接呼叫 revealAll，不經此端點，因此即使
// 未設定 CRON_SECRET，自動排程仍可運作；此端點僅用於外部 / 手動觸發。
//
// 安全性：密鑰**只接受 Authorization 標頭**。先前也接受 ?key= 查詢字串，
// 但查詢字串會被記進存取紀錄、反向代理紀錄與瀏覽器歷史，等同洩漏密鑰。
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  const provided = header.slice(7);

  // 長度不同時 timingSafeEqual 會丟錯，先比長度再做等長比較。
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const summary = await revealAll();
  return Response.json({ ok: true, ...summary });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
