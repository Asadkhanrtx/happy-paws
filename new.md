# Happy Paws — New Account Setup (From Scratch)

> Complete checklist to deploy the full stack in any AWS account.
> All infrastructure in one region (e.g. `ap-south-1`).

---

## 1. VPC & Networking

### Create VPC
- CIDR: `10.0.0.0/16`  
- Enable DNS hostnames + DNS resolution

### Create 6 Subnets

| Name                    | CIDR          | AZ   | Type         |
|-------------------------|---------------|------|--------------|
| happypaws-pub-1a        | 10.0.1.0/24   | AZ-a | Public       |
| happypaws-pub-1b        | 10.0.2.0/24   | AZ-b | Public       |
| happypaws-priv-app-1a   | 10.0.3.0/24   | AZ-a | Private App  |
| happypaws-priv-app-1b   | 10.0.4.0/24   | AZ-b | Private App  |
| happypaws-priv-db-1a    | 10.0.5.0/24   | AZ-a | Private DB   |
| happypaws-priv-db-1b    | 10.0.6.0/24   | AZ-b | Private DB   |

Enable **auto-assign public IPv4** on both public subnets.

### Internet Gateway
- Create IGW → attach to VPC

### NAT Gateway
- Create in `happypaws-pub-1a` → allocate new Elastic IP

### Route Tables
| Table name              | Associated subnets                     | Route                        |
|-------------------------|----------------------------------------|------------------------------|
| happypaws-rt-public     | pub-1a, pub-1b                         | 0.0.0.0/0 → IGW              |
| happypaws-rt-priv-app   | priv-app-1a, priv-app-1b               | 0.0.0.0/0 → NAT Gateway      |
| happypaws-rt-priv-db    | priv-db-1a, priv-db-1b                 | local only                   |

---

## 2. Security Groups

Create all inside the VPC above.

### happypaws-sg-alb
| Inbound  | HTTP 80  | 0.0.0.0/0          |
|----------|----------|--------------------|

### happypaws-sg-frontend
| Inbound  | HTTP 80  | happypaws-sg-alb   |
| Inbound  | SSH 22   | Your IP            |

### happypaws-sg-backend
| Inbound  | TCP 8000-8005 | happypaws-sg-alb      |
| Inbound  | TCP 8000-8005 | happypaws-sg-frontend |
| Inbound  | SSH 22        | Your IP               |

### happypaws-sg-rds
| Inbound  | MySQL 3306 | happypaws-sg-backend |

All four SGs: Outbound → All traffic → 0.0.0.0/0

---

## 3. RDS MySQL

1. Engine: **MySQL 8.0** | Template: Free tier
2. DB identifier: `happypaws-db`
3. Set your own:
   - Master username: `happypaws` (or anything you prefer)
   - Master password: choose a strong password
4. Instance: `db.t3.micro` | Storage: 20 GB
5. VPC: your VPC above
6. DB Subnet Group: create new → select `priv-db-1a` + `priv-db-1b`
7. Public access: **No**
8. Security group: `happypaws-sg-rds`
9. Click **Create database**

> After creation note down:
> - **Endpoint** (e.g. `xxxxx.xxxxxx.ap-south-1.rds.amazonaws.com`)
> - **Username**
> - **Password**

---

## 4. Update Code Before Deploying

> **This is the only file you need to edit for a new account.**

Open `backend/setup-backend.sh` and change lines 10–12:

```bash
RDS_ENDPOINT="<your-new-rds-endpoint>"   # ← paste RDS endpoint here
DB_USER="<your-rds-username>"             # ← your master username
DB_PASS="<your-rds-password>"             # ← your master password
```

Push to git:
```bash
git add backend/setup-backend.sh
git commit -m "update rds endpoint for new account"
git push
```

> No other file needs changing. Everything else (service URLs, ports, DB names) is auto-configured by the setup scripts.

---

## 5. Backend EC2

### Launch
| Setting          | Value                        |
|------------------|------------------------------|
| AMI              | Ubuntu Server 22.04 LTS      |
| Instance type    | t3.medium                    |
| Subnet           | happypaws-priv-app-1a        |
| Auto-assign IP   | Disable                      |
| Security group   | happypaws-sg-backend         |

### SSH & Run Setup
```bash
# SSH in (use frontend EC2 as jump host after it's created, or temporarily give backend a public IP)
ssh -J ubuntu@<FRONTEND_PUBLIC_IP> ubuntu@<BACKEND_PRIVATE_IP> -i your-key.pem

# On Backend EC2:
git clone https://github.com/<you>/happy-paws.git
cd happy-paws
bash backend/setup-backend.sh
```

The script automatically:
- Installs Python, pip, mysql-client
- Creates `/home/ubuntu/happypaws-venv`
- Installs all requirements (including `bcrypt<4.0.0`)
- Creates + starts all 6 systemd services with your RDS endpoint

### Verify
```bash
curl http://localhost:8000/health
curl http://localhost:8001/          # db_ready should be true
curl http://localhost:8000/api/pets/pets
```

---

## 6. Frontend EC2

### Launch
| Setting          | Value                        |
|------------------|------------------------------|
| AMI              | Ubuntu Server 22.04 LTS      |
| Instance type    | t3.small                     |
| Subnet           | happypaws-pub-1a             |
| Auto-assign IP   | **Enable**                   |
| Security group   | happypaws-sg-frontend        |

### SSH & Run Setup
```bash
ssh ubuntu@<FRONTEND_PUBLIC_IP> -i your-key.pem

git clone https://github.com/<you>/happy-paws.git
cd happy-paws
bash frontend/setup-frontend.sh
```

The script automatically:
- Installs Node 20, Nginx
- Runs `npm install` + `npm run build`
- Configures Nginx with SPA routing
- Starts Nginx on port 80

### Verify
```bash
curl http://localhost/healthz    # should return: ok
```

---

## 7. Application Load Balancer

### Target Group 1 — Frontend
- Protocol/Port: HTTP / **80**
- Health check path: `/healthz`
- Register: Frontend EC2

### Target Group 2 — Backend
- Protocol/Port: HTTP / **8000**
- Health check path: `/health`
- Register: Backend EC2

### Create ALB
1. Type: **Application** | Scheme: **Internet-facing**
2. VPC: your VPC | Subnets: `pub-1a` + `pub-1b`
3. Security group: `happypaws-sg-alb`
4. Listener HTTP:80 → default → forward to **happypaws-tg-frontend**
5. Create

### Add /api/* Rule
1. ALB → Listeners → View/edit rules → Add rule
2. Condition: **Path** = `/api/*`
3. Action: Forward to **happypaws-tg-backend**
4. Priority: **1**
5. Save

---

## 8. Test

Open: `http://<ALB-DNS-name>/`

Quick API checks:
```bash
# Register a user
curl -X POST http://<ALB-DNS>/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://<ALB-DNS>/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Get pets
curl http://<ALB-DNS>/api/pets/pets

# Get products
curl http://<ALB-DNS>/api/orders/products
```

All should return JSON. The React UI should be fully functional.

---

## Summary — What Changes Per Account

| What                     | Where                              | What to change                        |
|--------------------------|------------------------------------|---------------------------------------|
| RDS endpoint             | `backend/setup-backend.sh` line 10 | Your new RDS endpoint URL             |
| RDS username             | `backend/setup-backend.sh` line 11 | Your master username                  |
| RDS password             | `backend/setup-backend.sh` line 12 | Your master password                  |
| Everything else          | —                                  | No changes needed, all auto-configured|
