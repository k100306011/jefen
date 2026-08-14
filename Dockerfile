# syntax=docker/dockerfile:1

# ---- deps：安裝完整依賴（含 dev，供 build 與 prisma CLI）----
FROM node:20-bookworm-slim AS deps
WORKDIR /app
# better-sqlite3 為 native 模組，準備編譯工具以防無 prebuilt binary
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# ---- builder：產生 Prisma client 並 build Next.js ----
FROM node:20-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate

# NEXT_PUBLIC_* 是「建置期」注入的，必須在 build 前就存在。
# .dockerignore 排除了 .env.*，所以要靠 build arg 傳進來（見 docker-compose.yml 的 build.args）。
# 未傳時退回正式網域，與 src/lib/site.ts 的預設值一致。
ARG NEXT_PUBLIC_SITE_URL=https://jifen.space
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

RUN npm run build

# ---- runner：精簡的正式環境映像 ----
FROM node:20-bookworm-slim AS runner
WORKDIR /app
# sqlite3 CLI：供維運直接查／改資料庫（目前還沒有管理後台，處理檢舉與待審照片要靠它）
RUN apt-get update \
  && apt-get install -y --no-install-recommends sqlite3 \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATA_DIR=/app/data
ENV DATABASE_URL=file:/app/data/jifen.db
ENV TZ=Asia/Taipei

# runtime 所需檔案
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x docker-entrypoint.sh && mkdir -p /app/data

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
