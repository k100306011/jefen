import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// 把相對的 SQLite 路徑正規化成「相對專案根目錄」的絕對路徑，
// 確保 Prisma CLI（migrate/generate）與 runtime adapter 指向同一個 .db 檔。
function resolveSqliteUrl(raw: string | undefined): string {
  const url = raw && raw.length > 0 ? raw : "file:./data/jifen.db";
  if (url.startsWith("file:")) {
    const p = url.slice("file:".length);
    if (p === ":memory:" || path.isAbsolute(p)) return url;
    return `file:${path.resolve(process.cwd(), p)}`;
  }
  return url;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // 用 process.env（而非 env() helper）以便 Docker build 階段沒有 DATABASE_URL 時仍可 generate。
    url: resolveSqliteUrl(process.env.DATABASE_URL),
  },
});
