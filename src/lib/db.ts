import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// 直接使用連線字串：相對路徑（file:./data/jifen.db）以執行時的工作目錄（專案根）為基準，
// 與 Prisma CLI 產生的資料庫位置一致；正式環境用絕對路徑（file:/app/data/jifen.db）。
const DATABASE_URL = process.env.DATABASE_URL ?? "file:./data/jifen.db";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaBetterSqlite3({ url: DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

// 開發模式下用 global 快取避免 HMR 反覆建立連線。
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
