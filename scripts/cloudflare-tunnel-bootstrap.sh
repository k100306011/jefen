#!/usr/bin/env bash
# GCP VM 上一鍵完成 Cloudflare Tunnel（需網域 jifen.space 已加入 Cloudflare 並改好 NS）
set -euo pipefail
cd "$(dirname "$0")/.."

DOMAIN="${DOMAIN:-jifen.space}"
TUNNEL_NAME="${TUNNEL_NAME:-jifen}"
CF_DIR="$HOME/.cloudflared"
COMPOSE_CF_DIR="$PWD/cloudflared"

install_cloudflared() {
  if command -v cloudflared >/dev/null 2>&1; then return; fi
  echo "==> 安裝 cloudflared"
  ARCH=$(uname -m)
  case "$ARCH" in
    x86_64) BIN=cloudflared-linux-amd64 ;;
    aarch64|arm64) BIN=cloudflared-linux-arm64 ;;
    *) echo "不支援的架構: $ARCH"; exit 1 ;;
  esac
  curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/${BIN}" -o /tmp/cloudflared
  sudo install -m 755 /tmp/cloudflared /usr/local/bin/cloudflared
  cloudflared --version
}

ensure_login() {
  if [ -f "$CF_DIR/cert.pem" ]; then
    echo "✓ 已有 Cloudflare 登入憑證"
    return
  fi
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  請在瀏覽器開啟以下網址並登入 Cloudflare，"
  echo "  選擇網域 ${DOMAIN} 並授權："
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  cloudflared tunnel login 2>&1 | tee /tmp/cf-login.log || true
  if [ ! -f "$CF_DIR/cert.pem" ]; then
    echo ""
    echo "✗ 尚未完成授權。請執行： cloudflared tunnel login"
    echo "  完成後再跑： bash scripts/cloudflare-tunnel-bootstrap.sh"
    exit 1
  fi
}

create_tunnel() {
  mkdir -p "$COMPOSE_CF_DIR"
  if [ -f "$COMPOSE_CF_DIR/config.yml" ]; then
    echo "✓ tunnel config 已存在"
    return
  fi
  echo "==> 建立 tunnel: $TUNNEL_NAME"
  cloudflared tunnel create "$TUNNEL_NAME" 2>&1 | tee /tmp/cf-create.log
  TUNNEL_ID=$(cloudflared tunnel list 2>/dev/null | awk -v n="$TUNNEL_NAME" '$2==n {print $1; exit}')
  if [ -z "$TUNNEL_ID" ]; then
    echo "✗ 找不到 tunnel ID"; exit 1
  fi
  CRED_SRC="$CF_DIR/${TUNNEL_ID}.json"
  if [ ! -f "$CRED_SRC" ]; then
    echo "✗ 找不到 credentials: $CRED_SRC"; exit 1
  fi
  cp "$CRED_SRC" "$COMPOSE_CF_DIR/credentials.json"
  cat > "$COMPOSE_CF_DIR/config.yml" <<EOF
tunnel: ${TUNNEL_ID}
credentials-file: /etc/cloudflared/credentials.json
ingress:
  - hostname: ${DOMAIN}
    service: http://app:3000
  - hostname: www.${DOMAIN}
    service: http://app:3000
  - service: http_status:404
EOF
  echo "==> 設定 DNS（${DOMAIN} → tunnel）"
  cloudflared tunnel route dns "$TUNNEL_NAME" "$DOMAIN" || echo "  （根網域 route 可能已存在）"
  cloudflared tunnel route dns "$TUNNEL_NAME" "www.$DOMAIN" || echo "  （www route 可能已存在）"
}

start_stack() {
  echo "==> 啟動 Docker（app + tunnel）"
  docker compose --profile tunnel-creds up -d --build
  sleep 10
  docker compose ps
  echo ""
  echo "Tunnel 日誌："
  docker compose logs cloudflared --tail 15
}

install_cloudflared
ensure_login
create_tunnel
start_stack

echo ""
echo "✓ 完成。請測試：https://${DOMAIN}/api/healthz"
