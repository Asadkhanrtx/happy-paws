#!/bin/bash
# ============================================================
#  Happy Paws — Backend EC2 Setup Script
#  Run from the repo ROOT:  bash backend/setup-backend.sh
# ============================================================
set -euo pipefail

# ── Configuration ────────────────────────────────────────────
RDS_ENDPOINT="happypaws-db.c3oc42g2agem.ap-south-1.rds.amazonaws.com"
DB_USER="happypaws"
DB_PASS="HappyPaws123"

VENV_DIR="/home/ubuntu/happypaws-venv"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"   # repo root

# ── Colour helpers ────────────────────────────────────────────
GREEN="\033[0;32m"; YELLOW="\033[1;33m"; RED="\033[0;31m"; NC="\033[0m"
ok()   { echo -e "${GREEN}[✓] $*${NC}"; }
info() { echo -e "${YELLOW}[→] $*${NC}"; }
err()  { echo -e "${RED}[✗] $*${NC}"; }

echo ""
echo "============================================================"
echo "  Happy Paws Backend Setup"
echo "  App dir : $APP_DIR"
echo "  RDS     : $RDS_ENDPOINT"
echo "============================================================"
echo ""

# ── Step 1: System packages ───────────────────────────────────
info "Step 1/5 — Installing system packages..."
sudo apt-get update -y -qq
sudo apt-get install -y -qq python3-pip python3-venv git curl default-mysql-client
ok "System packages installed"

# ── Step 2: Python virtual environment ───────────────────────
info "Step 2/5 — Setting up Python virtualenv at $VENV_DIR..."
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"
pip install --quiet --upgrade pip
pip install --quiet -r "$APP_DIR/requirements.txt"
pip install --quiet 'bcrypt<4.0.0'   # passlib 1.7.4 incompatible with bcrypt 4.x
ok "Python dependencies installed"

# ── Step 3: Test RDS connection ───────────────────────────────
info "Step 3/5 — Testing RDS connection..."
if mysql -h "$RDS_ENDPOINT" -u "$DB_USER" -p"$DB_PASS" \
        --connect-timeout=10 -e "SELECT 'connected';" > /dev/null 2>&1; then
    ok "RDS connection successful"
else
    err "Could not connect to RDS — check Security Group (port 3306 from this EC2) and credentials"
    err "Continuing anyway — services will retry on startup"
fi

# ── Step 4: Create systemd unit files ────────────────────────
info "Step 4/5 — Creating systemd service files..."

# ── API Gateway ──────────────────────────────
sudo tee /etc/systemd/system/happypaws-gateway.service > /dev/null << UNIT
[Unit]
Description=HappyPaws API Gateway
After=network.target
Wants=network.target

[Service]
User=ubuntu
WorkingDirectory=${APP_DIR}/backend/api-gateway
Environment="USER_SERVICE_URL=http://localhost:8001"
Environment="PET_SERVICE_URL=http://localhost:8002"
Environment="APPOINTMENT_SERVICE_URL=http://localhost:8003"
Environment="ORDER_SERVICE_URL=http://localhost:8004"
Environment="NOTIFICATION_SERVICE_URL=http://localhost:8005"
ExecStart=${VENV_DIR}/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
UNIT

# ── User Service ─────────────────────────────
sudo tee /etc/systemd/system/happypaws-users.service > /dev/null << UNIT
[Unit]
Description=HappyPaws User Service
After=network.target

[Service]
User=ubuntu
WorkingDirectory=${APP_DIR}/backend/user-service
Environment="DATABASE_URL=mysql+pymysql://${DB_USER}:${DB_PASS}@${RDS_ENDPOINT}/happypaws_users"
ExecStart=${VENV_DIR}/bin/uvicorn main:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
UNIT

# ── Pet Service ──────────────────────────────
sudo tee /etc/systemd/system/happypaws-pets.service > /dev/null << UNIT
[Unit]
Description=HappyPaws Pet Service
After=network.target

[Service]
User=ubuntu
WorkingDirectory=${APP_DIR}/backend/pet-service
Environment="DATABASE_URL=mysql+pymysql://${DB_USER}:${DB_PASS}@${RDS_ENDPOINT}/happypaws_pets"
ExecStart=${VENV_DIR}/bin/uvicorn main:app --host 0.0.0.0 --port 8002
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
UNIT

# ── Appointment Service ──────────────────────
sudo tee /etc/systemd/system/happypaws-appointments.service > /dev/null << UNIT
[Unit]
Description=HappyPaws Appointment Service
After=network.target

[Service]
User=ubuntu
WorkingDirectory=${APP_DIR}/backend/appointment-service
Environment="DATABASE_URL=mysql+pymysql://${DB_USER}:${DB_PASS}@${RDS_ENDPOINT}/happypaws_appointments"
ExecStart=${VENV_DIR}/bin/uvicorn main:app --host 0.0.0.0 --port 8003
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
UNIT

# ── Order Service ─────────────────────────────
sudo tee /etc/systemd/system/happypaws-orders.service > /dev/null << UNIT
[Unit]
Description=HappyPaws Order Service
After=network.target

[Service]
User=ubuntu
WorkingDirectory=${APP_DIR}/backend/order-service
Environment="DATABASE_URL=mysql+pymysql://${DB_USER}:${DB_PASS}@${RDS_ENDPOINT}/happypaws_orders"
ExecStart=${VENV_DIR}/bin/uvicorn main:app --host 0.0.0.0 --port 8004
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
UNIT

# ── Notification Service ──────────────────────
sudo tee /etc/systemd/system/happypaws-notifications.service > /dev/null << UNIT
[Unit]
Description=HappyPaws Notification Service
After=network.target

[Service]
User=ubuntu
WorkingDirectory=${APP_DIR}/backend/notification-service
ExecStart=${VENV_DIR}/bin/uvicorn main:app --host 0.0.0.0 --port 8005
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
UNIT

ok "All service files created"

# ── Step 5: Enable and start all services ─────────────────────
info "Step 5/5 — Enabling and starting all services..."
sudo systemctl daemon-reload

SERVICES=(gateway users pets appointments orders notifications)
for svc in "${SERVICES[@]}"; do
    sudo systemctl enable "happypaws-$svc" > /dev/null 2>&1
    sudo systemctl restart "happypaws-$svc"
    ok "happypaws-$svc started"
done

# ── Final status ──────────────────────────────────────────────
echo ""
echo "============================================================"
echo "  Service Status"
echo "============================================================"
sleep 3   # give uvicorn a moment to bind
for svc in "${SERVICES[@]}"; do
    STATUS=$(systemctl is-active "happypaws-$svc" 2>/dev/null || echo "failed")
    if [ "$STATUS" = "active" ]; then
        ok "happypaws-$svc  →  active"
    else
        err "happypaws-$svc  →  $STATUS  (run: sudo journalctl -u happypaws-$svc -n 30)"
    fi
done

echo ""
echo "============================================================"
echo "  Quick smoke tests (run these after 5 seconds):"
echo "  curl http://localhost:8000/health"
echo "  curl http://localhost:8000/api/pets/pets"
echo "  curl http://localhost:8001/"
echo "============================================================"
echo ""
ok "Backend setup complete!"
