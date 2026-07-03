import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// 健康檢查：驗證資料庫連線（供 Docker healthcheck / 部署探針使用）。
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, db: "up" });
  } catch (err) {
    return Response.json(
      { ok: false, db: "down", error: String(err) },
      { status: 500 },
    );
  }
}
