# Production Readiness Guide

This document outlines the steps required to move the Real Estate CRM application into production.

---

## 1. Environment Variables (Required)

Configure these in your production environment (Cloud Run, Vercel, etc.):

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | ✅ | Set to `production` |
| `ALLOW_PRODUCTION` | ✅ | Set to `true` (enables production mode) |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Strong secret (min 32 chars). **Never use dev fallback in prod.** |
| `SESSION_SECRET` | ✅ | Strong secret for session encryption |
| `CORS_ORIGINS` | ✅ | Comma-separated allowed origins, e.g. `https://app.yoursite.com` |
| `PORT` | ⚪ | Default 8080 (Cloud Run) or 3000 (others) |

### Optional but Recommended

| Variable | Description |
|----------|-------------|
| `COOKIE_DOMAIN` | Your production domain (e.g. `.yoursite.com`) |
| `FORCE_SECURE_COOKIES` | Set `true` for HTTPS-only cookies |
| `APP_URL` / `PUBLIC_BASE_URL` | Base URL for sitemap, SEO |
| `LOG_LEVEL` | `info` or `warn` in production |
| `REDIS_URL` | For session store (if scaling beyond single instance) |

### Third-Party Services (if used)

- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` (SMS)
- `GOOGLE_MAPS_API_KEY` / `VITE_GOOGLE_MAPS_API_KEY` (Maps)
- `SMTP_*` (Email)

---

## 2. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations against production database
DATABASE_URL="postgresql://user:pass@prod-host:5432/dbname" npm run db:deploy

# (Optional) Seed Saudi geography data
DATABASE_URL="..." npm run db:seed-saudi-geography
```

**Ensure:**
- `property_id_seq` sequence exists (created by `add_property_listings` migration)
- Session store table exists (connect-pg-simple creates it if `createTableIfMissing: true`)

---

## 3. Build & Run Locally (Production Mode)

```bash
# Build frontend + API bundle
npm run build

# Run production server
NODE_ENV=production ALLOW_PRODUCTION=true JWT_SECRET=your-strong-secret SESSION_SECRET=your-session-secret DATABASE_URL=postgresql://... CORS_ORIGINS=https://yourdomain.com npm start
```

Verify:
- App serves from `dist/public`
- API responds at `/api/*`
- Health check: `GET /health`

---

## 4. Docker Deployment

```bash
# Build image
docker build -t real-estate-crm:latest .

# Run (pass env vars or use --env-file)
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e ALLOW_PRODUCTION=true \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=... \
  -e SESSION_SECRET=... \
  -e CORS_ORIGINS=https://yourdomain.com \
  real-estate-crm:latest
```

For **Google Cloud Run** (port 8080):
```bash
docker build -f Dockerfile.gcp -t gcr.io/PROJECT_ID/real-estate-crm .
docker push gcr.io/PROJECT_ID/real-estate-crm
```

---

## 5. Production Entry Point

The build outputs `dist/index.js` from `apps/api/index.prod.ts`. It includes:
- **12MB JSON body limit** (for unverified listings with base64 images)
- **CORS** (from `CORS_ORIGINS` or `CORS_ORIGIN`)
- **Health check** (via `/health` from routes, checks DB/Redis)
- **Static SPA serving** from `dist/public`

---

## 6. Pre-Launch Checklist

### Security
- [ ] No `JWT_SECRET` or `SESSION_SECRET` in code or public repos
- [ ] `ALLOW_PRODUCTION=true` only in production env
- [ ] CORS restricted to your production domain(s)
- [ ] Secure cookies enabled (`secure: true`, `httpOnly: true`)
- [ ] Admin impersonation disabled (`ALLOW_ADMIN_RESET` not set in prod)

### Database
- [ ] Migrations applied to production DB
- [ ] Backups configured
- [ ] Connection pool / limits tuned for expected load

### Testing
- [ ] Critical flows tested: login, unverified listing submit, dashboard
- [ ] Arabic RTL layout verified
- [ ] Mobile responsiveness checked

### Monitoring
- [ ] Health endpoint (`/health`) monitored
- [ ] Error tracking (e.g. Sentry) if desired
- [ ] Log aggregation

---

## 7. Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run build` | Build frontend + API |
| `npm start` | Run production server |
| `npm run db:deploy` | Apply migrations |
| `npm run db:generate` | Generate Prisma client |

---

## 8. Common Issues

| Issue | Fix |
|-------|-----|
| "Production mode is disabled" | Set `ALLOW_PRODUCTION=true` |
| "Missing JWT_SECRET" | Set a strong secret (32+ chars) |
| Unverified listing 500 / payload too large | Ensure `express.json({ limit: "12mb" })` in prod entry |
| CORS errors | Add your frontend URL to `CORS_ORIGINS` |
| Session not persisting | Check `DATABASE_URL`, `SESSION_SECRET`, `COOKIE_DOMAIN` |
