# Happy Paws — AWS Cloud Deployment Guide

> **Goal**: Test the full application on two EC2 instances (Frontend in public subnet, Backend in private subnet) + RDS MySQL, routed through an Application Load Balancer — all in **ap-south-1 (Mumbai)**.

---

## Architecture

```
Internet
    │
    ▼
[ALB — internet-facing]   happypaws-pub-1a + happypaws-pub-1b
    │
    ├── Path: /api/*  ──►  Backend EC2  (happypaws-priv-app-1a)
    │                       ├── API Gateway   :8000
    │                       ├── user-service  :8001
    │                       ├── pet-service   :8002
    │                       ├── appt-service  :8003
    │                       ├── order-service :8004
    │                       └── notif-service :8005
    │                                │
    │                                ▼
    │               RDS MySQL  (happypaws-priv-db-1a + 1b)
    │               happypaws-db.c3oc42g2agem.ap-south-1.rds.amazonaws.com
    │
    └── Path: /*  ──►  Frontend EC2  (happypaws-pub-1a)
                        └── Nginx :80  →  React build
```

---

## Your RDS Details (already created)

| Key        | Value                                                        |
|------------|--------------------------------------------------------------|
| Endpoint   | `happypaws-db.c3oc42g2agem.ap-south-1.rds.amazonaws.com`    |
| Port       | `3306`                                                       |
| Username   | `happypaws`                                                  |
| Password   | `HappyPaws123`                                               |
| Region     | `ap-south-1`                                                 |

> **Do you need to create databases manually? NO.**
> Each backend service automatically runs `CREATE DATABASE IF NOT EXISTS happypaws_<name>` on first start.
> The databases `happypaws_users`, `happypaws_pets`, `happypaws_appointments`, `happypaws_orders` are all created automatically.

---

## Step 1 — VPC & Subnets

### 1.1 Create VPC
- **Name**: `happypaws-vpc`
- **IPv4 CIDR**: `10.0.0.0/16`
- Enable DNS hostnames: **Yes**
- Enable DNS resolution: **Yes**

### 1.2 Create 6 Subnets

| Name                    | CIDR           | AZ              | Type          |
|-------------------------|----------------|-----------------|---------------|
| `happypaws-pub-1a`      | 10.0.1.0/24    | ap-south-1a     | Public        |
| `happypaws-pub-1b`      | 10.0.2.0/24    | ap-south-1b     | Public        |
| `happypaws-priv-app-1a` | 10.0.3.0/24    | ap-south-1a     | Private (App) |
| `happypaws-priv-app-1b` | 10.0.4.0/24    | ap-south-1b     | Private (App) |
| `happypaws-priv-db-1a`  | 10.0.5.0/24    | ap-south-1a     | Private (DB)  |
| `happypaws-priv-db-1b`  | 10.0.6.0/24    | ap-south-1b     | Private (DB)  |

For both public subnets: enable **"Auto-assign public IPv4 address"**.

### 1.3 Internet Gateway
1. Create IGW: `happypaws-igw`
2. Attach it to `happypaws-vpc`

### 1.4 NAT Gateway
1. Create in `happypaws-pub-1a`
2. Allocate a new Elastic IP
3. Name: `happypaws-nat`

### 1.5 Route Tables

**Public route table** (`happypaws-rt-public`):
- Associate: `happypaws-pub-1a`, `happypaws-pub-1b`
- Add route: `0.0.0.0/0` → `happypaws-igw`

**Private app route table** (`happypaws-rt-private-app`):
- Associate: `happypaws-priv-app-1a`, `happypaws-priv-app-1b`
- Add route: `0.0.0.0/0` → `happypaws-nat`  *(backend needs internet to install packages)*

**Private DB route table** (`happypaws-rt-private-db`):
- Associate: `happypaws-priv-db-1a`, `happypaws-priv-db-1b`
- No internet route — DB subnet stays isolated

---

## Step 2 — Security Groups

Create all four SGs inside `happypaws-vpc`.

### SG 1 — ALB (`happypaws-sg-alb`)
| Direction | Protocol | Port | Source    |
|-----------|----------|------|-----------|
| Inbound   | HTTP     | 80   | 0.0.0.0/0 |
| Outbound  | All      | All  | 0.0.0.0/0 |

### SG 2 — Frontend EC2 (`happypaws-sg-frontend`)
| Direction | Protocol | Port | Source              |
|-----------|----------|------|---------------------|
| Inbound   | HTTP     | 80   | `happypaws-sg-alb`  |
| Inbound   | SSH      | 22   | Your IP             |
| Outbound  | All      | All  | 0.0.0.0/0           |

### SG 3 — Backend EC2 (`happypaws-sg-backend`)
| Direction | Protocol | Port      | Source                           |
|-----------|----------|-----------|----------------------------------|
| Inbound   | TCP      | 8000-8005 | `happypaws-sg-alb`               |
| Inbound   | TCP      | 8000-8005 | `happypaws-sg-frontend`          |
| Inbound   | SSH      | 22        | Your IP (or jump via Frontend)   |
| Outbound  | All      | All       | 0.0.0.0/0                        |

### SG 4 — RDS (`happypaws-sg-rds`)  *(update your existing RDS SG)*
| Direction | Protocol | Port | Source                   |
|-----------|----------|------|--------------------------|
| Inbound   | MySQL    | 3306 | `happypaws-sg-backend`   |
| Outbound  | All      | All  | 0.0.0.0/0                |

> Go to your existing RDS instance → **Modify** → change its security group to `happypaws-sg-rds`.

---

## Step 3 — Backend EC2

### 3.1 Launch Instance
| Setting           | Value                            |
|-------------------|----------------------------------|
| Name              | `happypaws-backend`              |
| AMI               | Ubuntu Server 22.04 LTS          |
| Instance type     | `t3.medium`                      |
| Key pair          | Your existing key pair           |
| VPC               | `happypaws-vpc`                  |
| Subnet            | `happypaws-priv-app-1a`          |
| Auto-assign IP    | **Disable**                      |
| Security group    | `happypaws-sg-backend`           |

### 3.2 SSH into the Backend EC2

Since it's in a private subnet, SSH through the Frontend EC2 as a jump host:
```bash
# From your local machine (run this AFTER the frontend EC2 is up)
ssh -J ubuntu@<FRONTEND_PUBLIC_IP> ubuntu@<BACKEND_PRIVATE_IP> -i your-key.pem

# Or for a one-time direct test, temporarily attach an Elastic IP to the backend,
# SSH in, then remove the EIP after setup.
```

### 3.3 Clone the Repo and Run Setup Script
```bash
# On the Backend EC2:
git clone https://github.com/<your-username>/happy-paws.git
cd happy-paws

# Run the one-shot setup script
bash backend/setup-backend.sh
```

The script will:
1. Install Python 3, pip, git, mysql-client
2. Create a Python virtualenv at `/home/ubuntu/happypaws-venv`
3. Install all requirements
4. Test RDS connectivity (warns if it fails, doesn't abort)
5. Create systemd unit files for all 6 services with the RDS endpoint baked in
6. Enable and start all services

### 3.4 Verify Backend
```bash
# All services should be active
sudo systemctl status 'happypaws-*' --no-pager

# Quick API tests
curl http://localhost:8000/health
curl http://localhost:8000/api/pets/pets
curl http://localhost:8001/
```

---

## Step 4 — Frontend EC2

### 4.1 Launch Instance
| Setting           | Value                            |
|-------------------|----------------------------------|
| Name              | `happypaws-frontend`             |
| AMI               | Ubuntu Server 22.04 LTS          |
| Instance type     | `t3.small`                       |
| Key pair          | Your existing key pair           |
| VPC               | `happypaws-vpc`                  |
| Subnet            | `happypaws-pub-1a`               |
| Auto-assign IP    | **Enable**                       |
| Security group    | `happypaws-sg-frontend`          |

### 4.2 SSH and Run Setup Script
```bash
# From your local machine
ssh ubuntu@<FRONTEND_PUBLIC_IP> -i your-key.pem

# On the Frontend EC2:
git clone https://github.com/<your-username>/happy-paws.git
cd happy-paws

# Run the one-shot setup script
bash frontend/setup-frontend.sh
```

The script will:
1. Install Node.js 20 LTS, Nginx, git, curl
2. Run `npm install` inside `frontend/`
3. Run `npm run build` — produces `/dist` folder
4. Write an optimised Nginx config (SPA routing + gzip + caching)
5. Start and enable Nginx
6. Smoke test port 80

### 4.3 Verify Frontend
```bash
curl http://localhost/        # should return HTML
curl http://localhost/healthz # should return: ok
```

---

## Step 5 — Application Load Balancer

### 5.1 Create Target Groups

**Target Group — Frontend** (`happypaws-tg-frontend`):
| Setting            | Value              |
|--------------------|--------------------|
| Target type        | Instances          |
| Protocol / Port    | HTTP / 80          |
| VPC                | `happypaws-vpc`    |
| Health check path  | `/healthz`         |
| Register target    | Frontend EC2       |

**Target Group — Backend** (`happypaws-tg-backend`):
| Setting            | Value              |
|--------------------|--------------------|
| Target type        | Instances          |
| Protocol / Port    | HTTP / 8000        |
| VPC                | `happypaws-vpc`    |
| Health check path  | `/health`          |
| Health check port  | `8000`             |
| Register target    | Backend EC2        |

### 5.2 Create the ALB
1. **EC2 → Load Balancers → Create → Application Load Balancer**
2. Name: `happypaws-alb`
3. Scheme: **Internet-facing** | IP type: IPv4
4. VPC: `happypaws-vpc`
5. Subnets: `happypaws-pub-1a` + `happypaws-pub-1b`
6. Security group: `happypaws-sg-alb`
7. Listener: HTTP:80 → default action → Forward to `happypaws-tg-frontend`
8. Click **Create load balancer**

### 5.3 Add the /api/* Routing Rule
1. Go to your ALB → **Listeners** → **View/edit rules** on port 80
2. Click **Add rule** (the `+` icon)
3. **Condition**: Path is `/api/*`
4. **Action**: Forward to `happypaws-tg-backend`
5. **Priority**: `1`  ← must be higher priority than the default rule
6. Save

### 5.4 Copy the ALB DNS Name
From the ALB details page, copy the DNS name. It will look like:
```
happypaws-alb-123456789.ap-south-1.elb.amazonaws.com
```
Open this in your browser — the Happy Paws app should load.

---

## Step 6 — Testing Checklist

Open `http://<ALB-DNS>/` in your browser and verify:

- [ ] Home page loads with hero section, stats, and pet images
- [ ] `/pets` — pet catalog shows 10 pets with photos, filter buttons work
- [ ] `/shop` — product catalog shows 15 items with category filters
- [ ] `/booking` — form submits and shows confirmation
- [ ] `/register` — creates user in RDS MySQL
- [ ] `/login` — authenticates against MySQL
- [ ] Cart — add products, badge updates in navbar

### API smoke tests (browser or Postman)
```
GET  http://<ALB-DNS>/api/pets/pets
GET  http://<ALB-DNS>/api/orders/products
POST http://<ALB-DNS>/api/users/register
     body: {"email":"test@test.com","password":"test123"}
POST http://<ALB-DNS>/api/users/login
     body: {"email":"test@test.com","password":"test123"}
POST http://<ALB-DNS>/api/appointments/book
     body: {"service_type":"grooming","date":"2026-06-01T10:00","pet_id":"1","user_id":1}
```

### Verify RDS databases were auto-created
```bash
# Run this from the Backend EC2
mysql -h happypaws-db.c3oc42g2agem.ap-south-1.rds.amazonaws.com \
      -u happypaws -p'HappyPaws123' \
      -e "SHOW DATABASES;"
```
You should see: `happypaws_users`, `happypaws_pets`, `happypaws_appointments`, `happypaws_orders`.

---

## Troubleshooting

### Service not starting on Backend EC2
```bash
sudo journalctl -u happypaws-users    -n 50 --no-pager
sudo journalctl -u happypaws-pets     -n 50 --no-pager
sudo journalctl -u happypaws-gateway  -n 50 --no-pager
```

### RDS connection refused
```bash
# From Backend EC2:
nc -zv happypaws-db.c3oc42g2agem.ap-south-1.rds.amazonaws.com 3306
# If this hangs → SG-RDS is blocking port 3306 from SG-Backend
```

### ALB health check failing for backend target group
```bash
# From Backend EC2:
curl http://localhost:8000/health   # must return {"status":"healthy",...}
```
If this fails, check `journalctl -u happypaws-gateway`.

### Frontend shows blank white page
```bash
sudo nginx -t
sudo cat /var/log/nginx/error.log | tail -20
# Usually means dist/ is empty — re-run: npm run build
```

### `/api/*` returns 404 from ALB
- The path rule at priority 1 must have condition `/api/*` (not `/api` without the `*`)
- Backend target group health check must be green (both targets healthy) in the ALB console

---

## Environment Variable Reference

All values are baked into the systemd units by `backend/setup-backend.sh`. If you need to change the password or endpoint, edit the script and re-run it, or update each unit file directly at `/etc/systemd/system/happypaws-*.service` then run `sudo systemctl daemon-reload && sudo systemctl restart happypaws-*`.

| Service             | Variable        | Value                                                                 |
|---------------------|-----------------|-----------------------------------------------------------------------|
| user-service        | DATABASE_URL    | `mysql+pymysql://happypaws:HappyPaws123@<RDS_ENDPOINT>/happypaws_users` |
| pet-service         | DATABASE_URL    | `mysql+pymysql://happypaws:HappyPaws123@<RDS_ENDPOINT>/happypaws_pets` |
| appointment-service | DATABASE_URL    | `mysql+pymysql://happypaws:HappyPaws123@<RDS_ENDPOINT>/happypaws_appointments` |
| order-service       | DATABASE_URL    | `mysql+pymysql://happypaws:HappyPaws123@<RDS_ENDPOINT>/happypaws_orders` |
| api-gateway         | *_SERVICE_URL   | all `http://localhost:800X` (co-located on same EC2)                  |

---

## Next Steps (after testing passes)

1. **HTTPS** — Add ACM certificate to ALB, add HTTPS:443 listener, redirect HTTP→HTTPS
2. **Auto Scaling** — Convert both EC2s to Launch Templates + Auto Scaling Groups behind the ALB
3. **Secrets Manager** — Move `DB_PASS` out of scripts into AWS Secrets Manager
4. **CloudWatch** — Alarms on ALB 5xx errors, EC2 CPU, RDS connections
5. **Domain** — Route 53 A-record → ALB DNS alias
