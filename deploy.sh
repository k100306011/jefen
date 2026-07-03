#!/usr/bin/env bash
# 幾分 — 一鍵部署 / 更新腳本（在部署主機上執行）
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env.production ]; then
  echo "✗ 找不到 .env.production"
  echo "  請先： cp .env.example .env.production  並填入 AUTH_SECRET / AUTH_URL / GOOGLE_* / TUNNEL_TOKEN"
  exit 1
fi

echo "==> 拉取最新程式碼（若為 git 倉庫）"
git pull --ff-only 2>/dev/null || echo "   （非 git 倉庫或無更新，略過）"

echo "==> 建置並啟動容器"
docker compose up -d --build

echo "==> 目前狀態"
sleep 5
docker compose ps

echo ""
echo "✓ 完成。"
echo "  即時日誌：   docker compose logs -f app"
echo "  Tunnel 日誌：docker compose logs -f cloudflared"
