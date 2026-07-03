import { getSiteStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

// 公開的全站統計（不含任何個資），供落地頁 / 外部監控使用。
export async function GET() {
  const stats = await getSiteStats();
  return Response.json(stats, {
    headers: { "Cache-Control": "public, max-age=60" },
  });
}
