# Happy Paws — Application Architecture Overview

---

## What This Application Is

Happy Paws is a full-stack pet care platform where users can browse pets, book grooming/vaccination/checkup appointments, shop for pet products, and receive notifications. It is built as a **microservices architecture** — meaning instead of one big backend, the backend is split into multiple small independent services, each responsible for one domain.

---

## Technology Stack at a Glance

| Layer              | Technology                          | Purpose                              |
|--------------------|-------------------------------------|--------------------------------------|
| Frontend           | React 19, Vite, Tailwind CSS, Axios | UI, routing, API calls               |
| API Gateway        | FastAPI, httpx                      | Single entry point, request routing  |
| All Microservices  | FastAPI, uvicorn                    | Business logic per domain            |
| ORM                | SQLAlchemy                          | Python ↔ MySQL communication         |
| DB Driver          | PyMySQL                             | MySQL connection for Python          |
| Database           | MySQL 8.0 (AWS RDS)                 | Persistent data storage              |
| Password Hashing   | passlib + bcrypt                    | Secure password storage              |
| Auth Token         | JWT (python-jose)                   | Session management after login       |
| Web Server         | Nginx                               | Serves React static build            |
| ASGI Server        | uvicorn                             | Runs each FastAPI service            |

---

## High-Level Flow

```
User's Browser
     │
     │  HTTP Request (Axios)
     ▼
React Frontend  ──────────────────────────────────────────
     │
     │  Every API call goes to /api/*
     ▼
API Gateway (Port 8000)   ← single entry point for all services
     │
     ├──► User Service        (Port 8001)  ──► MySQL: happypaws_users
     ├──► Pet Service         (Port 8002)  ──► MySQL: happypaws_pets
     ├──► Appointment Service (Port 8003)  ──► MySQL: happypaws_appointments
     ├──► Order Service       (Port 8004)  ──► MySQL: happypaws_orders
     └──► Notification Service(Port 8005)  ──► (no database)
```

The frontend never talks to individual services directly. Everything goes through the API Gateway first.

---

## The Frontend

**React 19** with **React Router** handles all page navigation on the client side (SPA — Single Page Application). This means there is only one HTML file (`index.html`) served to the browser, and React handles showing/hiding pages without reloading.

**Axios** is the HTTP client used to make all API calls from the browser to the backend.

**Tailwind CSS** handles all styling with a Burgundy color theme.

### Pages and what API each page calls

| Page          | API Call                                  | Purpose                         |
|---------------|-------------------------------------------|---------------------------------|
| Pets          | `GET /api/pets/pets`                      | Fetch pet catalog               |
| Shop          | `GET /api/orders/products`                | Fetch product catalog           |
| Booking       | `POST /api/appointments/book`             | Submit appointment booking      |
| Login         | `POST /api/users/login`                   | Authenticate user               |
| Register      | `POST /api/users/register`               | Create new account              |
| Notifications | `GET /api/notifications/...`              | Get user notifications          |

All API calls are prefixed with `/api`. In production, the ALB (load balancer) sees this prefix and routes the request to the backend EC2. Nginx on the frontend EC2 only serves the React files — it never handles `/api` calls.

---

## The API Gateway

**Port 8000** — FastAPI + httpx

This is the **only service the frontend talks to**. Its entire job is request routing.

### How it works step by step

1. A request arrives: `POST /api/users/register`
2. Gateway reads the path, strips `/api`, takes the first segment → `users`
3. Looks up `users` in its service map → `http://localhost:8001`
4. Forwards the full request (method, headers, body) to `http://localhost:8001/register` using **httpx** (async HTTP client)
5. Gets the response back from user-service
6. Returns that response to the browser

```python
# Service map inside the gateway
SERVICES = {
    "users":         "http://localhost:8001",
    "pets":          "http://localhost:8002",
    "appointments":  "http://localhost:8003",
    "orders":        "http://localhost:8004",
    "notifications": "http://localhost:8005",
}
```

The gateway also handles **CORS** (Cross-Origin Resource Sharing) — this allows the browser to make API calls across different origins without being blocked.

The gateway does **not** do authentication, caching, or business logic. It is a pure router.

---

## Authentication — How Login and JWT Works

### Registration Flow
```
Browser  →  POST /api/users/register  {email, password}
         →  API Gateway
         →  User Service
                │
                ├─ Check if email already exists in DB
                ├─ Hash the password using bcrypt
                │   (bcrypt is a one-way algorithm — original password is never stored)
                ├─ Save {email, hashed_password, role} to happypaws_users DB
                └─ Return {"msg": "User registered successfully"}
```

### Login Flow
```
Browser  →  POST /api/users/login  {email, password}
         →  API Gateway
         →  User Service
                │
                ├─ Fetch user record from DB by email
                ├─ Use bcrypt.verify(entered_password, stored_hash)
                │   (compares without ever decrypting — bcrypt doesn't decrypt)
                ├─ If match → return JWT token + role
                └─ If no match → return 400 error
```

### What is a JWT Token?

JWT stands for **JSON Web Token**. It is a string that looks like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyQHRlc3QuY29tIn0.signature
```

It has three parts separated by dots:
- **Header** — algorithm used (HS256)
- **Payload** — data inside (email, role, expiry time)
- **Signature** — cryptographic proof it wasn't tampered with

The frontend stores this token in `localStorage` after login. For protected actions, the token should be sent in the `Authorization` header of each request. The backend can verify the token is valid without hitting the database every time — the signature check is enough.

> In the current implementation, the JWT is a placeholder token. The structure is in place but full token validation middleware on every route is not yet wired up — it is ready to be added.

### Session Storage
User session data (email, role) is stored in browser `localStorage` after login. The cart is also stored in `localStorage`. This means sessions persist across page refreshes but are browser-local.

---

## The Five Microservices

### 1. User Service — Port 8001

**Responsibility**: Everything related to user identity.

**Endpoints**:
- `POST /register` — create account, hash password, save to DB
- `POST /login` — verify credentials, return token

**Database**: `happypaws_users`
```
users table:
  id              INT (primary key, auto increment)
  email           VARCHAR(255) unique
  hashed_password VARCHAR(255)
  role            VARCHAR(50)  default: "user"
```

**Key libraries**: passlib (password hashing), bcrypt (hashing algorithm), SQLAlchemy (ORM)

---

### 2. Pet Service — Port 8002

**Responsibility**: Pet catalog management.

**Endpoints**:
- `GET /pets` — return all pets (optional `?type=Dog` filter)
- `POST /pets` — add a new pet

**Startup behaviour**: On first start, if the pets table is empty, it automatically seeds **10 pets** with name, breed, age, description, and an Unsplash image URL. This means the catalog is populated without any manual data entry.

**Database**: `happypaws_pets`
```
pets table:
  id           INT (primary key)
  name         VARCHAR(100)
  type         VARCHAR(50)   e.g. Dog, Cat, Rabbit
  breed        VARCHAR(100)
  age          INT
  image_url    VARCHAR(500)
  description  VARCHAR(500)
  available    INT           1 = available, 0 = adopted
```

---

### 3. Appointment Service — Port 8003

**Responsibility**: Booking management for all pet services.

**Endpoints**:
- `POST /book` — create a new appointment
- `GET /list/{user_id}` — list all appointments for a user

**Service types supported**: grooming, vaccination, checkup, shelter visit

**Database**: `happypaws_appointments`
```
appointments table:
  id           INT (primary key)
  user_id      INT
  pet_id       VARCHAR(50)
  service_type VARCHAR(50)
  date         VARCHAR(50)
  status       VARCHAR(50)  default: "confirmed"
```

---

### 4. Order Service — Port 8004

**Responsibility**: Product catalog and order processing.

**Endpoints**:
- `GET /products` — return all products (optional `?category=` filter)
- `POST /place-order` — record a new order

**Startup behaviour**: On first start, if the products table is empty, it seeds **15 products** across categories (Food, Toys, Beds, Accessories, Grooming, Furniture, Training) with real Unsplash images.

**Database**: `happypaws_orders`
```
products table:
  id        INT (primary key)
  name      VARCHAR(200)
  price     FLOAT
  image_url VARCHAR(500)
  category  VARCHAR(100)

orders table:
  id          INT (primary key)
  user_id     INT
  product_ids VARCHAR(500)  stored as JSON string
  status      VARCHAR(50)   default: "confirmed"
```

---

### 5. Notification Service — Port 8005

**Responsibility**: Sending notifications to users.

**Endpoints**:
- `POST /send` — receive {user_id, message}, log and deliver notification

**No database**. This service is **stateless** — it receives a notification request, processes it (currently logs it, ready for email/SMS integration), and responds. Nothing is persisted.

---

## Database Architecture

### How Many Databases?

There is **one MySQL server instance** (AWS RDS) running **four separate databases**:

```
MySQL Server (one RDS instance)
├── happypaws_users         ← owned by User Service
├── happypaws_pets          ← owned by Pet Service
├── happypaws_appointments  ← owned by Appointment Service
└── happypaws_orders        ← owned by Order Service
```

### Are They Tightly or Loosely Coupled?

**Loosely coupled.** This is intentional and a core principle of microservices.

- Each service owns its database exclusively
- No service reads or writes directly into another service's database
- If the Pet Service goes down, the Order Service continues working — they share no tables
- There are **no foreign keys across databases** — referential integrity between services is handled at the application level, not the database level
- A `user_id` in the appointments table is just a number — the Appointment Service does not join with the users table to verify it

### How Do Services Know About Each Other's Data?

They don't query each other's databases. If Service A needs data from Service B, it makes an **HTTP call** to Service B's endpoint. In the current implementation, most cross-service communication is initiated from the frontend (through the gateway) rather than service-to-service.

### Auto Database Creation

Every service runs this on startup:
```sql
CREATE DATABASE IF NOT EXISTS `happypaws_<name>`;
```
Then SQLAlchemy's `Base.metadata.create_all()` creates all tables inside that database. This means **you never need to manually create any database or table** — just point the service at the MySQL server and it bootstraps itself.

---

## How All Services Are Connected on the Server

All six services (gateway + 5 microservices) run on the **same backend EC2 instance** as separate processes managed by systemd. They communicate over `localhost` — no network hop needed between them.

```
Backend EC2 (one machine)
├── happypaws-gateway       → uvicorn on 0.0.0.0:8000
├── happypaws-users         → uvicorn on 0.0.0.0:8001
├── happypaws-pets          → uvicorn on 0.0.0.0:8002
├── happypaws-appointments  → uvicorn on 0.0.0.0:8003
├── happypaws-orders        → uvicorn on 0.0.0.0:8004
└── happypaws-notifications → uvicorn on 0.0.0.0:8005
```

Each service is independent — you can restart one without affecting the others. systemd ensures they auto-restart if they crash.

---

## Complete Request Lifecycle Example

**User adds a product to cart and places an order:**

```
1. Browser loads /shop
   └─ React fetches: GET /api/orders/products
   └─ Gateway routes to Order Service GET /products
   └─ Order Service queries happypaws_orders.products table
   └─ Returns 15 products as JSON
   └─ React renders product cards

2. User clicks "Add to Cart"
   └─ React saves product to localStorage (no API call — purely browser-side)

3. User goes to /checkout and clicks "Place Order"
   └─ React sends: POST /api/orders/place-order  {user_id, product_ids}
   └─ Gateway routes to Order Service POST /place-order
   └─ Order Service writes to happypaws_orders.orders table
   └─ Returns {order_id: 123, msg: "Order placed successfully"}
   └─ React shows confirmation screen
```

---

## Summary

| Concept               | Answer                                                        |
|-----------------------|---------------------------------------------------------------|
| Architecture style    | Microservices — 6 independent FastAPI services                |
| Frontend framework    | React 19 (SPA) with Axios for API calls                       |
| How frontend connects | Only to API Gateway — never to individual services directly   |
| Gateway role          | URL-based routing only — no business logic                    |
| Auth mechanism        | bcrypt password hashing + JWT token on login                  |
| Number of databases   | 4 MySQL databases on 1 RDS instance                           |
| DB coupling           | Loosely coupled — each service owns its own database          |
| Cross-service talk    | HTTP only — no shared database, no message queue              |
| Data seeding          | Pet catalog (10) and product catalog (15) auto-seed on startup|
| Stateless service     | Notification Service — no database, no state                  |
