# JSONTools — JSON Compare SaaS Platform

Enterprise-grade JSON comparison, validation, and transformation platform.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| API | Fastify (Node.js) + TypeScript |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache / Queue | Redis 7 + BullMQ |
| Auth | JWT + Argon2 |
| Payments | Razorpay |
| Monorepo | pnpm workspaces + Turborepo |

---

## Local Development

Apps run natively. PostgreSQL and Redis are remote-hosted — just point `DATABASE_URL` and `REDIS_URL` to your instances.

## Docker (Cloudflare Tunnel: Web + API)

This setup runs **two containers**:

- Web frontend on port `3000`
- API server on port `4000`

PostgreSQL and Redis stay remote.
Cloudflare Tunnel handles TLS termination and forwards HTTP to your container ports.

### 1. Configure environment values

Edit `docker-compose.web.yml` and replace placeholder values:

- API service:
	- `DATABASE_URL` (remote Postgres)
	- `REDIS_URL` (remote Redis)
	- `JWT_SECRET`
	- `INTERNAL_API_KEY`
- Web service:
	- `NEXTAUTH_SECRET`

Domain values are already set for your setup:

- `https://jsontools.endusercompute.in` (web)
- `https://json-tools-api.endusercompute.in` (api)

### 2. Build and run

```bash
docker compose -f docker-compose.web.yml up -d --build
```

### 3. Cloudflare Tunnel routing

Configure your tunnel ingress rules to forward:

- `jsontools.endusercompute.in` -> `http://<docker-host-ip>:3000`
- `json-tools-api.endusercompute.in` -> `http://<docker-host-ip>:4000`

### 4. Stop

```bash
docker compose -f docker-compose.web.yml down
```

### Prerequisites

- Node.js >= 20
- pnpm >= 9 (`npm install -g pnpm@9.15.0`)
- A running PostgreSQL instance (remote)
- A running Redis instance (remote)

### 1. Clone & Install

```bash
git clone <repo-url>
cd jsontools
pnpm install
```

### 2. Configure Environment

```bash
# API
cp .env.example apps/api/.env

# Web
cp .env.example apps/web/.env.local
```

Edit `apps/api/.env` — fill in your remote connection strings:
```env
DATABASE_URL=postgresql://user:password@your-host:5432/jsontools
REDIS_URL=redis://:password@your-redis-host:6379
JWT_SECRET=your-super-secret-min-32-chars-here
INTERNAL_API_KEY=your-internal-api-key-here
```

Edit `apps/web/.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
API_URL=http://localhost:4000
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### 3. Run Database Migrations & Seed

```bash
pnpm db:push      # Push schema to DB
pnpm db:seed      # Seed test users
```

Seed creates:
- **Admin**: `admin@jsontools.dev` / `Admin@12345`
- **User**: `user@jsontools.dev` / `Test@12345`

### 4. Start Development Servers

```bash
pnpm dev
```

- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **Swagger UI**: http://localhost:4000/documentation

### 5. (Optional) Database GUI

```bash
pnpm db:studio    # Prisma Studio on http://localhost:5555
```

---

## Running Tests

```bash
pnpm --filter @jsontools/api test
pnpm --filter @jsontools/api test:coverage
```

```
jsontools/
├── apps/
│   ├── api/                    # Fastify REST API
│   │   ├── src/
│   │   │   ├── config/         # env validation
│   │   │   ├── lib/            # prisma, redis, logger
│   │   │   ├── middleware/     # auth guards
│   │   │   ├── routes/         # API endpoints
│   │   │   └── services/       # business logic (compare engine)
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # DB schema
│   │   │   └── seed.ts         # Seed data
│   │   └── tests/              # Unit tests
│   └── web/                    # Next.js frontend
│       └── src/
│           ├── app/            # App Router pages
│           ├── components/     # React components
│           │   ├── compare/    # Compare workspace
│           │   ├── landing/    # Landing page sections
│           │   ├── layout/     # Navbar, Footer
│           │   └── ui/         # shadcn/ui primitives
│           ├── lib/            # utilities
│           └── store/          # Zustand state
├── packages/
│   └── shared/                 # TypeScript types shared between API & Web
├── docker/
│   └── nginx/nginx.conf        # Production nginx config
├── docker-compose.dev.yml      # LOCAL DEV — infra only (postgres + redis)
├── docker-compose.yml          # PRODUCTION — full stack
└── turbo.json                  # Turborepo config
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/compare` | Compare two JSON payloads |
| GET | `/api/v1/comparison/:id` | Get comparison by ID |
| GET | `/api/v1/comparison/share/:token` | Public shared comparison |
| POST | `/api/v1/beautify` | Beautify / pretty-print JSON |
| POST | `/api/v1/validate` | Validate JSON |
| POST | `/api/v1/minify` | Minify JSON |
| POST | `/api/v1/auth/register` | Register user |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/me` | Current user |
| GET | `/api/v1/usage` | Usage summary |
| GET/POST/DELETE | `/api/v1/api-keys` | Manage API keys |
| GET | `/api/v1/billing/packages` | Credit packages |
| POST | `/api/v1/billing/order` | Create Razorpay order |
| POST | `/api/v1/billing/verify` | Verify payment |
| GET | `/api/v1/admin/users` | Admin: list users |
| GET | `/api/v1/admin/stats` | Admin: platform stats |
| GET | `/health` | Health check |

---

## Project Structure

| Package | Credits | Price |
|---------|---------|-------|
| Starter | 10 | ₹5 |
| Basic | 100 | ₹50 |
| Pro | 1000 | ₹500 |
| Enterprise | Custom | ₹4 / 10 calls |

Free signup includes **10 free credits**.
