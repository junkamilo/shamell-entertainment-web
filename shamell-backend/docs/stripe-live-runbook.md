# Stripe Live Runbook (On Coming Events)

## Required environment variables

### Render (backend)

- `STRIPE_SECRET_KEY`: use `sk_live_...` (or `rk_live_...` if using restricted keys).
- `STRIPE_WEBHOOK_SECRET`: use `whsec_...` from the Live webhook endpoint.
- `FRONTEND_URL`: production frontend URL(s), comma-separated if multiple.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (optional mirror): set to `pk_live_...` for startup mismatch checks.

### Vercel (frontend)

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: use `pk_live_...`.
- `NEXT_PUBLIC_BACKEND_URL`: production backend base URL.

## Stripe Dashboard setup (Live mode)

1. Create webhook endpoint:
   - URL: `https://<backend-domain>/api/v1/stripe/webhook`
2. Subscribe events:
   - `checkout.session.completed`
   - `checkout.session.expired`
3. Copy webhook signing secret (`whsec_...`) to Render as `STRIPE_WEBHOOK_SECRET`.

## Security controls implemented in backend

- Rejects invalid webhook signature.
- Uses raw request body for Stripe signature verification.
- Deduplicates webhook processing by persistent `event.id`.
- Validates `payment_status === paid` before moving reservation to `PAID`.
- Validates `amount_total` and `currency` match reservation values.
- Keeps retry-safe behavior:
  - already processed event => returns success with deduplication.
  - transient server errors => Stripe can retry.

## Production go-live checklist (real money)

1. Confirm no mixed-mode keys:
   - backend key is live (`sk_live_` or `rk_live_`)
   - frontend key is live (`pk_live_`)
2. Deploy backend and frontend with updated variables.
3. Perform low-amount real payment for a table.
4. Perform low-amount real payment for a standalone chair.
5. Verify for both payments:
   - webhook event logged
   - reservation status becomes `PAID`
   - confirmation email sent
6. Re-send one processed webhook event from Stripe Dashboard:
   - ensure deduplication (no double processing).

## Incident response quick actions

### Payment succeeded in Stripe but reservation not marked `PAID`

1. Locate `checkout.session.completed` by session ID in Stripe logs.
2. Check backend logs for:
   - signature errors
   - amount/currency mismatch
   - DB failures
3. Re-deliver webhook event from Stripe Dashboard after resolving root cause.

### Suspected key leak

1. Rotate affected Stripe API key immediately.
2. Update Render/Vercel environment variables.
3. Redeploy services.
4. Audit recent Stripe request logs by key.

### Webhook instability

1. Confirm endpoint is reachable and returns timely responses.
2. Confirm `STRIPE_WEBHOOK_SECRET` is from the same Live endpoint.
3. Check duplicate/retry rates in logs and investigate repeated failures.
