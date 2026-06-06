# Operations — backups & recovery

## Database

Shamell uses PostgreSQL via Neon or Supabase (see `DATABASE_URL` / `DIRECT_URL` in `.env.example`).

### Recommended settings

- Enable **Point-in-Time Recovery (PITR)** on the production project.
- Keep at least **7 days** of restore window for production.
- Run `prisma migrate deploy` only after reviewing migration SQL in staging.

### Restore (high level)

1. Open provider console (Neon/Supabase).
2. Create a branch / restore point from before the incident.
3. Point staging `DATABASE_URL` at the restored instance and verify.
4. Swap production connection string during a maintenance window.

### RPO / RTO targets (suggested)

| Metric | Target |
|--------|--------|
| RPO | ≤ 1 hour (PITR) |
| RTO | ≤ 4 hours (manual restore + redeploy) |

## Stripe

- Webhook events are audited in `stripe_webhook_events`.
- Failed webhooks: re-deliver from Stripe Dashboard or fix root cause and reconcile via return-page / admin tools.

## Application logs

- Backend: Render log stream; search codes from `stripe-live-runbook.md`.
- Frontend: Vercel deployment logs.

## Failed Stripe webhooks (manual / cron)

1. Query `stripe_webhook_events` where `status = 'FAILED'` and `updatedAt` older than 1 hour.
2. Fix root cause (missing enrollment, amount mismatch, etc.).
3. Re-deliver from Stripe Dashboard **or** reconcile via public `session-status` / `reconcile` endpoints.
4. Optional: scheduled job to alert ops when `FAILED` count > 0 (not yet automated in-app).
