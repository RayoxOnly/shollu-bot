#!/bin/bash
# ============================================
#  Bot Absen Shollu - Auto Setup Script
#  Jalankan: chmod +x setup.sh && ./setup.sh
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════╗"
echo "║     Bot Absen Shollu - Auto Setup         ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# ---- 1. Update system & install build tools ----
echo -e "${YELLOW}[1/6] Menginstall system dependencies...${NC}"
sudo apt-get update -qq
sudo apt-get install -y -qq curl build-essential python3 > /dev/null 2>&1
echo -e "${GREEN}  ✓ System dependencies terinstall${NC}"

# ---- 2. Install Node.js (jika belum ada) ----
echo -e "${YELLOW}[2/6] Mengecek Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VER=$(node -v)
    echo -e "${GREEN}  ✓ Node.js sudah terinstall: ${NODE_VER}${NC}"
else
    echo -e "${YELLOW}  → Menginstall Node.js 20 LTS...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
    sudo apt-get install -y -qq nodejs > /dev/null 2>&1
    echo -e "${GREEN}  ✓ Node.js $(node -v) terinstall${NC}"
fi

# ---- 3. Install PM2 globally ----
echo -e "${YELLOW}[3/6] Menginstall PM2...${NC}"
if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}  ✓ PM2 sudah terinstall${NC}"
else
    sudo npm install -g pm2 > /dev/null 2>&1
    echo -e "${GREEN}  ✓ PM2 terinstall${NC}"
fi

# ---- 4. Install npm dependencies ----
echo -e "${YELLOW}[4/6] Menginstall npm packages...${NC}"
npm install --production > /dev/null 2>&1
echo -e "${GREEN}  ✓ npm packages terinstall${NC}"

# ---- 5. Create data directory ----
echo -e "${YELLOW}[5/6] Menyiapkan direktori data...${NC}"
mkdir -p data
echo -e "${GREEN}  ✓ Direktori data siap${NC}"

# ---- 6. Setup Nginx reverse proxy ----
echo -e "${YELLOW}[6/6] Mengkonfigurasi Nginx...${NC}"
NGINX_CONF="/etc/nginx/sites-available/bot-absen-shollu"
if [ ! -f "$NGINX_CONF" ]; then
    sudo tee "$NGINX_CONF" > /dev/null <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
    # Remove default site and enable our config
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/bot-absen-shollu
    sudo nginx -t > /dev/null 2>&1 && sudo systemctl reload nginx
    echo -e "${GREEN}  ✓ Nginx dikonfigurasi (port 80 → 3000)${NC}"
else
    echo -e "${GREEN}  ✓ Nginx config sudah ada${NC}"
fi

# ---- 7. Setup PM2 startup ----
echo -e "${YELLOW}[*] Setting up PM2 auto-start on boot...${NC}"
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $(whoami) --hp $HOME > /dev/null 2>&1 || true
echo -e "${GREEN}  ✓ PM2 startup configured${NC}"

# ---- Done ----
echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════╗"
echo "║          ✅ Setup Selesai!                 ║"
echo "╚═══════════════════════════════════════════╝${NC}"
echo ""
echo -e "Jalankan bot:"
echo -e "  ${GREEN}pm2 start ecosystem.config.js${NC}"
echo -e "  ${GREEN}pm2 save${NC}"
echo ""
echo -e "Buka dashboard di browser:"
echo -e "  ${GREEN}http://<ip-vps-kamu>${NC}"
echo ""
echo -e "Perintah berguna:"
echo -e "  ${YELLOW}pm2 logs bot-absen${NC}    — lihat log realtime"
echo -e "  ${YELLOW}pm2 restart bot-absen${NC} — restart bot"
echo -e "  ${YELLOW}pm2 stop bot-absen${NC}    — stop bot"
echo ""
