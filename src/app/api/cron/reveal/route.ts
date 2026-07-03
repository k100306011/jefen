import type { NextRequest } from "next/server";
import { revealAll } from "@/lib/reveal";

export const dynamic = "force-dynamic";

// 受 CRON_SECRET 保護的揭曉觸發端點，可供外部排程器（系統 cron / Cloud Scheduler）呼叫。
// 內建的 node-cron（instrumentation.ts）會直接呼叫 revealAll，不經此端點，因此即使
// 未設定 CRON_SECRET，自動排程仍可運作；此端點僅用於外部 / 手動觸發。
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const key = req.nextUrl.searchParams.get("key");
  return bearer === secret || key === secret;
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
