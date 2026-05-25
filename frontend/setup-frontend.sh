#!/bin/bash
# ============================================================
#  Happy Paws — Frontend EC2 Setup Script
#  Run from the repo ROOT:  bash frontend/setup-frontend.sh
# ============================================================
set -euo pipefail

# ── Configuration ─────────────────────────────────────────────
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"   # repo root
FRONTEND_DIR="${APP_DIR}/frontend"
DIST_DIR="${FRONTEND_DIR}/dist"

# ── Colour helpers ────────────────────────────────────────────
GREEN="\033[0;32m"; YELLOW="\033[1;33m"; RED="\033[0;31m"; NC="\033[0m"
ok()   { echo -e "${GREEN}[✓] $*${NC}"; }
info() { echo -e "${YELLOW}[→] $*${NC}"; }
err()  { echo -e "${RED}[✗] $*${NC}"; }

echo ""
echo "============================================================"
echo "  Happy Paws Frontend Setup"
echo "  App dir      : $APP_DIR"
echo "  Frontend dir : $FRONTEND_DIR"
echo "============================================================"
echo ""

# ── Step 1: System packages ───────────────────────────────────
info "Step 1/5 — Installing system packages..."
sudo apt-get update -y -qq
sudo apt-get install -y -qq git curl nginx

# Install Node.js 20 LTS
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
    info "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
    sudo apt-get install -y -qq nodejs
fi

ok "Node $(node -v) and Nginx installed"

# ── Step 2: Install npm dependencies ─────────────────────────
info "Step 2/5 — Installing npm dependencies..."
cd "$FRONTEND_DIR"
npm install --silent
ok "npm dependencies installed"

# ── Step 3: Build React app ────────────────────────────────────
info "Step 3/5 — Building React production bundle..."
# VITE_API_URL is intentionally empty — the browser calls /api/* on the same
# ALB origin, so the ALB routes those requests to the backend automatically.
npm run build
ok "React build complete — output at $DIST_DIR"

# ── Step 4: Configure Nginx ────────────────────────────────────
info "Step 4/5 — Configuring Nginx..."

sudo tee /etc/nginx/sites-available/happypaws > /dev/null << NGINX_CONF
server {
    listen 80;
    server_name _;

    root ${DIST_DIR};
    index index.html;

    # Serve the React SPA — all unknown paths return index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache hashed static assets for 1 year
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Health check endpoint for ALB
    location /healthz {
        return 200 'ok';
        add_header Content-Type text/plain;
        access_log off;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
}
NGINX_CONF

# Enable site, disable default
sudo ln -sf /etc/nginx/sites-available/happypaws /etc/nginx/sites-enabled/happypaws
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
ok "Nginx configured and started"

# ── Step 5: Verify ────────────────────────────────────────────
info "Step 5/5 — Running smoke tests..."
sleep 2

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
if [ "$HTTP_CODE" = "200" ]; then
    ok "Nginx serving on port 80 (HTTP $HTTP_CODE)"
else
    err "Nginx returned HTTP $HTTP_CODE — check: sudo nginx -t && sudo journalctl -u nginx"
fi

HEALTH=$(curl -s http://localhost/healthz)
if [ "$HEALTH" = "ok" ]; then
    ok "Health check /healthz → ok"
fi

echo ""
echo "============================================================"
echo "  Frontend setup complete!"
echo ""
echo "  The React app is now served on port 80."
echo "  Once you point the ALB to this EC2 on port 80:"
echo "    - Browser loads React from:   http://ALB_DNS/"
echo "    - API calls go to:             http://ALB_DNS/api/*"
echo "    - ALB routes /api/* to the backend EC2 on port 8000"
echo ""
echo "  ALB health check path:  /healthz  (port 80)"
echo "============================================================"
echo ""
