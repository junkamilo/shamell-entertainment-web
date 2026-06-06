# Shamell's Golden Stage

Monorepo for the Shamell public site and admin panel.

## Structure

| Package | Stack | Default port |
|---------|-------|--------------|
| [`shamell-frontend`](shamell-frontend) | Next.js 16 | 3000 |
| [`shamell-backend`](shamell-backend) | NestJS 11 + Prisma | 3001 |

## Local development

```bash
# Backend
cd shamell-backend
cp .env.example .env   # fill DATABASE_URL, Stripe, JWT_SECRET, etc.
npm install
npx prisma migrate dev
npm run start:dev

# Frontend (separate terminal)
cd shamell-frontend
cp .env.example .env.local
npm install
npm run dev
```

## Health & smoke checks

- Backend liveness: `GET /api/v1/health`
- Backend readiness: `GET /api/v1/health/ready`
- Frontend return routes: `npm run smoke:returns` (server must be running)

## Stripe & payments

See [`shamell-backend/docs/stripe-live-runbook.md`](shamell-backend/docs/stripe-live-runbook.md) and [`stripe-webhooks.md`](shamell-backend/docs/stripe-webhooks.md).

Webhook endpoint (canonical): `POST /api/v1/stripe/webhook`

## Deploy

- **Backend:** Render (or similar) — `npm run start:prod` runs migrations then starts the API.
- **Frontend:** Vercel — set `NEXT_PUBLIC_BACKEND_URL` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

## Backups

Use your database provider PITR / automated backups (Neon, Supabase). Document RPO/RTO in your ops runbook; restore via provider console.

## CI

GitHub Actions runs lint, test, and build on push/PR. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
