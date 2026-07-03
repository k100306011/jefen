# 部署指南：Oracle Cloud 永久免費 VM + Cloudflare

> 本專案網域：**jifen.space**（下文出現「你的網域」即代表 `jifen.space`）

這套組合**永久免費**、資料持久、不用改任何程式碼，並用 Cloudflare Tunnel 讓 VM **零開放端口**。

架構：`使用者 → Cloudflare（DNS/SSL/CDN）→ Cloudflare Tunnel → VM 上的 Docker（Next.js + SQLite）`

---

## 你需要準備

- 一個網域（已有）
- Cloudflare 帳號（免費）
- Oracle Cloud 帳號（免費；註冊需綁卡驗證，但 Always Free 資源不扣款）
- Google OAuth 憑證（已有，稍後補上正式網域回呼）

---

## 步驟 1：把網域接到 Cloudflare

1. 登入 Cloudflare → **Add a site** → 輸入你的網域 → 選 **Free** 方案
2. Cloudflare 會給你兩個 nameserver，到你的網域註冊商把 NS 改成它們
3. 等生效（通常幾分鐘到數小時）

## 步驟 2：開一台 Oracle Always Free VM

1. Oracle Cloud Console → **Compute → Instances → Create instance**
2. **Image**：Ubuntu 22.04
3. **Shape**：點 Change shape → **Ampere（ARM）→ VM.Standard.A1.Flex**，設 **2 OCPU / 12 GB**（都在 Always Free 額度內；標示 "Always Free-eligible"）
4. **SSH keys**：上傳你的公鑰（或讓它產生並下載私鑰）
5. Boot volume 保持 50 GB
6. Create。建立後記下 **Public IP**

> ARM 架構沒問題：我們的 Docker base image `node:20` 有 ARM64 版，`better-sqlite3` 會在機器上自行編譯（Dockerfile 已備好編譯工具）。

## 步驟 3：VM 安裝 Docker

SSH 進去：

```bash
ssh ubuntu@<你的_VM_IP>
```

安裝 Docker：

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2 git
sudo usermod -aG docker $USER
# 重新登入讓群組生效
exit
```

再連一次：`ssh ubuntu@<你的_VM_IP>`

## 步驟 4：取得程式碼

若你把專案推到 GitHub：

```bash
git clone <你的 repo 網址> jifen
cd jifen
```

（若還沒推上 git，我可以幫你初始化並推到你的 GitHub；或用 `scp -r` 把整個資料夾上傳，但**不要**上傳 `node_modules`、`.next`、`data`。）

## 步驟 5：建立 Cloudflare Tunnel

1. Cloudflare → **Zero Trust**（左側）→ **Networks → Tunnels → Create a tunnel**
2. 選 **Cloudflared** → 命名 `jifen` → Save
3. 在 "Install and run a connector" 那頁，複製出現的 **token**（`eyJ...` 那一長串）
4. 設定 **Public Hostname**：
   - Subdomain：留空（用根網域）或填 `app`
   - Domain：選你的網域
   - Type：**HTTP**
   - URL：`app:3000`  ← 就是 docker service 名稱
5. Save

## 步驟 6：填寫環境變數

```bash
cp .env.example .env.production
nano .env.production
```

填入：

```bash
AUTH_SECRET=<執行 openssl rand -base64 32 產生>
AUTH_URL=https://你的網域
GOOGLE_CLIENT_ID=<你的>
GOOGLE_CLIENT_SECRET=<你的>
TUNNEL_TOKEN=<步驟 5 複製的 token>
CRON_SECRET=<執行 openssl rand -hex 16 產生，選填>
GEMINI_API_KEY=<選填，留空則略過圖片審核>
```

> `AUTH_URL` 一定要用 `https://` 開頭的正式網域，否則 Google 登入的回呼會失敗。

## 步驟 7：啟動

```bash
chmod +x deploy.sh
./deploy.sh
```

首次會 build（ARM 上編譯 better-sqlite3 約數分鐘）。完成後：

```bash
docker compose ps          # app 應為 healthy、cloudflared 為 running
docker compose logs -f app # 看到 "nightly reveal scheduled" 代表排程已啟動
```

## 步驟 8：補上 Google OAuth 正式網域

GCP Console → 憑證 → 你的 OAuth 用戶端 → **已授權的重新導向 URI** 新增：

```
https://你的網域/api/auth/callback/google
```

## 完成 🎉

打開 `https://你的網域`，用 Google 登入即可。每晚 21:00（台北時間）自動揭曉。

---

## 日常維運

| 事項 | 指令 |
| --- | --- |
| 更新版本 | `./deploy.sh` |
| 看日誌 | `docker compose logs -f app` |
| 重啟 | `docker compose restart` |
| 手動觸發揭曉 | `curl -X POST "https://你的網域/api/cron/reveal?key=<CRON_SECRET>"` |
| 備份資料 | `docker run --rm -v jifen_jifen-data:/data -v $PWD:/backup alpine tar czf /backup/jifen-backup.tar.gz -C /data .` |
| 還原資料 | `docker run --rm -v jifen_jifen-data:/data -v $PWD:/backup alpine sh -c "cd /data && tar xzf /backup/jifen-backup.tar.gz"` |

> volume 名稱可用 `docker volume ls` 確認（通常是 `jifen_jifen-data`）。

## 疑難排解

- **Google 登入 redirect_uri_mismatch**：確認 GCP 的重新導向 URI 與 `AUTH_URL` 完全一致（含 https、無結尾斜線）。
- **網域打不開**：`docker compose logs -f cloudflared` 看 tunnel 是否連上；確認 Public Hostname 的 Service 是 `app:3000`。
- **健康檢查失敗**：`docker compose logs app` 看啟動錯誤；`curl` VM 內 `docker exec jifen node -e "fetch('http://localhost:3000/api/healthz').then(r=>r.text()).then(console.log)"`。
- **磁碟空間**：定期 `docker system prune -f` 清理舊 image 層。
