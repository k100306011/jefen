import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readPhotoFile } from "@/lib/storage";

// 授權後才提供圖片：登入使用者才能讀取（評分需要看到他人照片）。
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const photo = await prisma.photo.findUnique({
    where: { id },
    select: { storageKey: true },
  });
  if (!photo) return new Response("Not found", { status: 404 });

  const file = await readPhotoFile(photo.storageKey);
  if (!file) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
