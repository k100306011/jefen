#!/usr/bin/env bash
# 在 GCP VM 上設定 Cloudflare Tunnel（需先有 TUNNEL_TOKEN）
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -z "${1:-}" ]; then
  echo "用法: $0 <TUNNEL_TOKEN>"
  echo "  token 來自 Cloudflare Zero Trust → Networks → Tunnels → 你的 tunnel → Configure → Docker"
  exit 1
fi

TOKEN="$1"

if [ ! -f .env.production ]; then
  cp .env.example .env.production
  echo "已建立 .env.production，請確認 AUTH_URL / GOOGLE_* / AUTH_SECRET 已填"
fi

if grep -q '^TUNNEL_TOKEN=' .env.production; then
  sed -i.bak "s|^TUNNEL_TOKEN=.*|TUNNEL_TOKEN=${TOKEN}|" .env.production
  rm -f .env.production.bak
else
  echo "TUNNEL_TOKEN=${TOKEN}" >> .env.production
fi

echo "==> 啟動 app + cloudflared tunnel"
docker compose --profile tunnel up -d --build

sleep 8
docker compose ps
echo ""
echo "Tunnel 日誌（最後 10 行）："
docker compose logs cloudflared --tail 10
