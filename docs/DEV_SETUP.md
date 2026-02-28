# Development Environment Setup

This guide covers all ways to run the Real Estate CRM application locally.

---

## Prerequisites

- **Node.js** 18+ (20 recommended)
- **pnpm** (or npm)
- **PostgreSQL** 14+ (or Docker)
- **Git**

---

## Option 1: Dev Container (Recommended)

One-click development environment using Cursor or VS Code.

### Steps

1. Open the project in **Cursor** or **VS Code**
2. When prompted, click **"Reopen in Container"**  
   - Or: Command Palette → `Dev Containers: Reopen in Container`
3. Wait for the container to build (first time: 2–5 minutes)
4. In the terminal, run:

```bash
# Run database migrations
pnpm run db:deploy

# Seed the database (optional)
pnpm run db:seed-saudi-geography
pnpm run db:agent1

# Start the app
pnpm run dev
```

5. Open **http://localhost:3000**

### What's Included

- Node.js 20
- PostgreSQL 15 (port 5432)
- Redis 7 (port 6379)
- Project dependencies installed
- Prisma client generated

---

## Option 2: Docker Compose (Database + Redis Only)

Use Docker for PostgreSQL and Redis, run the app on your host.

### Steps

1. Start services:

```bash
docker compose -f docker-compose.dev.yml up -d postgres-dev redis-dev
```

2. Copy environment file:

```bash
cp .env.dev.example .env
```

3. Install dependencies and run migrations:

```bash
pnpm install
pnpm run db:generate
pnpm run db:deploy
pnpm run db:seed-saudi-geography
pnpm run db:agent1
```

4. Start the app:

```bash
pnpm run dev
```

5. Open **http://localhost:3000**

---

## Option 3: Local PostgreSQL

Use a local PostgreSQL installation.

### Steps

1. Install PostgreSQL (macOS: `brew install postgresql`, Ubuntu: `apt install postgresql`)

2. Create database and schema:

```bash
createdb real_estate_crm
psql -d real_estate_crm -c "CREATE SCHEMA IF NOT EXISTS real_estate_crm;"
```

3. Copy and edit `.env`:

```bash
cp .env.dev.example .env
# Edit DATABASE_URL: postgresql://USER:PASS@localhost:5432/real_estate_crm?schema=real_estate_crm
```

4. Run setup:

```bash
pnpm install
pnpm run db:generate
pnpm run db:deploy
pnpm run db:seed-saudi-geography
pnpm run db:agent1
```

5. Start the app:

```bash
pnpm run dev
```

---

## Option 4: Full Docker Compose (App + DB + Redis)

Run the entire stack in Docker.

```bash
docker compose -f docker-compose.dev.yml up
```

App: **http://localhost:3000**

---

## Test Accounts

After seeding:

| Role            | Email                         | Password  |
|-----------------|-------------------------------|-----------|
| Website Admin   | admin@aqaraty.com             | admin123  |
| Corporate Owner | owner1@riyadh-realestate.com | owner123  |
| Individual Agent| agent1@example.com           | 123456    |
| Seller          | seller1@example.com          | seller123 |
| Buyer           | buyer1@example.com           | buyer123  |

---

## Environment Variables

| Variable        | Required | Description                          |
|-----------------|----------|--------------------------------------|
| DATABASE_URL    | Yes      | PostgreSQL connection string        |
| JWT_SECRET      | Yes      | JWT signing secret                   |
| SESSION_SECRET  | Yes      | Session encryption secret            |
| PORT            | No       | Server port (default: 3000)          |
| REDIS_URL       | No       | Redis URL (optional)                 |
| TWILIO_*        | No       | For SMS in pool                      |
| GOOGLE_MAPS_*   | No       | For map features                     |

---

## Common Commands

```bash
pnpm run dev          # Start unified dev server (port 3000)
pnpm run build        # Build for production
pnpm run db:deploy    # Run migrations
pnpm run db:generate  # Generate Prisma client
pnpm run db:seed-saudi-geography  # Seed Saudi geography
pnpm run db:agent1    # Create agent1 user
```

---

## Troubleshooting

### Port 3000 already in use

```bash
# Kill process on port 3000 (Linux/macOS)
lsof -ti:3000 | xargs kill -9
```

### Database connection refused

- Ensure PostgreSQL is running
- Check `DATABASE_URL` host/port
- For Docker: use `localhost` when connecting from host, `postgres` when from another container

### Prisma schema not found

```bash
pnpm run db:generate
```

### RLS policies

If you need Row Level Security policies applied:

```bash
for f in data/schema/db/policies/*.sql; do
  psql "$DATABASE_URL" -f "$f"
done
```
