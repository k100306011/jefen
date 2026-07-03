import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

// 圖片存放於 DATA_DIR/uploads（DATA_DIR 預設為專案根的 data/，部署時掛 volume）。
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export const ALLOWED_IMAGE_MIME = Object.keys(EXT_BY_MIME);
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB

async function ensureUploadsDir(): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

export async function savePhotoFile(bytes: Buffer, mimeType: string): Promise<string> {
  await ensureUploadsDir();
  const ext = EXT_BY_MIME[mimeType] ?? "jpg";
  const key = `${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(UPLOADS_DIR, key), bytes);
  return key;
}

export async function readPhotoFile(
  storageKey: string,
): Promise<{ bytes: Buffer; mimeType: string } | null> {
  const safe = path.basename(storageKey); // 防目錄穿越
  try {
    const bytes = await fs.readFile(path.join(UPLOADS_DIR, safe));
    const ext = path.extname(safe).slice(1).toLowerCase();
    return { bytes, mimeType: MIME_BY_EXT[ext] ?? "application/octet-stream" };
  } catch {
    return null;
  }
}

export async function deletePhotoFile(storageKey: string): Promise<void> {
  const safe = path.basename(storageKey);
  try {
    await fs.unlink(path.join(UPLOADS_DIR, safe));
  } catch {
    // 檔案不存在則忽略
  }
}
