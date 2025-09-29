# Production Runbook

This app serves both the React frontend (landing + dashboard) and the API from the same Node process in production.

## Build

1. Install dependencies
   - `npm install`
2. Build frontend + backend
   - `npm run build`

This produces the server bundle at `dist/index.js` and the built client at `dist/public/*`.

## Run

Environment variables:
- `NODE_ENV=production` (required)
- `PORT=3000` (optional; defaults to 3000)
- `JWT_SECRET=<strong-secret>` (required; the server will refuse to start if missing/insecure)
- `PUBLIC_BASE_URL=https://your-domain` (optional; affects sitemaps/links)

Run with Node:

```
JWT_SECRET="change-me" NODE_ENV=production npm run start
```

OR with PM2:

```
npm run build
JWT_SECRET="change-me" PUBLIC_BASE_URL="https://your-domain" pm2 start ecosystem.config.js
pm2 save
```

## Endpoints

- UI: `http://localhost:3000` (serves built client)
- API: `http://localhost:3000/api/*`
- Auth health: `GET /api/auth/ping` → `{ success: true }`

## Admin Access

If you need to seed or ensure a primary admin in production, use a safe migration/seed strategy. The dev‑only HTTP setup endpoint is disabled in production.

CLI ensure (run on the server):

```
PRIMARY_ADMIN_USERNAME=admin PRIMARY_ADMIN_PASSWORD=admin123 tsx server/ensure-primary-admin.ts
```

## Reverse Proxy (optional)

With Nginx:

```
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Troubleshooting

- Server exits immediately in production: ensure `JWT_SECRET` is set and not the default.
- 404 on UI routes: ensure `npm run build` created `dist/public` and `NODE_ENV=production` is set.
- CORS/proxy issues: serve the UI and API from the same origin (default) or configure your proxy accordingly.

