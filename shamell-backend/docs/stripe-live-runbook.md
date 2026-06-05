# Stripe Live Runbook (On Coming Events)

## Required environment variables

### Render (backend)

- `STRIPE_SECRET_KEY`: use `sk_live_...` (or `rk_live_...` if using restricted keys).
- `STRIPE_WEBHOOK_SECRET`: use `whsec_...` from the Live webhook endpoint.
- `FRONTEND_URL`: production frontend URL(s), comma-separated if multiple.
- `MAILERSEND_API_KEY`, `MAILERSEND_FROM_EMAIL`: Shamell transactional emails (customer + admin).
- `ADMIN_OPS_EMAIL`: Shamell ops inbox (default `shamellgolden@gmail.com`). Receives Stripe payment outcomes (PAID, deposit, expired, cancelled) **and** mirrors when customers are emailed for concierge/booking inquiries, reservation confirmations, and booking payment links. Customer payment confirmation emails do **not** send a second admin copy (payment notify is enough).
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (optional mirror): set to `pk_live_...` for startup mismatch checks.

### Vercel (frontend)

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: use `pk_live_...`.
- `NEXT_PUBLIC_BACKEND_URL`: production backend base URL.

## Stripe Dashboard setup (Live mode)

1. Create webhook endpoint:
   - URL: `https://<backend-domain>/api/v1/stripe/webhook`
   - Do **not** use `/api/v1/bookings/public/webhook` for upcoming/fixed/venue flows.
2. Subscribe events:
   - `checkout.session.completed`
   - `checkout.session.expired`
3. Copy webhook signing secret (`whsec_...`) to Render as `STRIPE_WEBHOOK_SECRET`.
4. **Customer receipts (Stripe):** Settings → Customer emails → enable successful payment receipts (separate from Shamell MailerSend emails).

## Checkout metadata flows

| `metadata.flow` | Handler |
|-----------------|---------|
| `booking_quote` | Bookings quote payments |
| `class_session` | Upcoming class enrollments |
| `fixed_event_ticket` | Fixed event ticket (BUY TICKET) |
| `venue_seat` | On Coming Events seat reservations |

Unified webhook: `POST /api/v1/stripe/webhook` — signature verified once, then dispatch: booking → class → fixed ticket → venue.

## Database diagnostics

```sql
-- Recent webhook audit rows
SELECT "eventId", "eventType", "metadataFlow", "checkoutSessionId", "handler",
       "processedAt", "attempts", "lastError", "createdAt"
FROM stripe_webhook_events
ORDER BY "createdAt" DESC
LIMIT 20;

-- Fixed ticket enrollment for a checkout session
SELECT id, status, "ticketNumber", "stripeCheckoutSessionId", "stripePaymentIntentId",
       "paymentMethodBrand", "paymentMethodLast4", "paidAt", "customerEmail"
FROM upcoming_fixed_event_enrollments
WHERE "stripeCheckoutSessionId" = 'cs_...';
```

## Log codes

- `stripe-webhook-invalid-signature` — wrong `STRIPE_WEBHOOK_SECRET` or altered body
- `stripe-webhook-not-handled` — unknown flow / handler returned false
- `fixed-ticket-webhook-missing` — enrollment row missing for session (should not occur after fix)
- `fixed-ticket-email-failed` / `fixed-ticket-email-sent` — MailerSend outcome
- `webhook-paid-missing-reservation` — venue session not found

## Security controls implemented in backend

- Single `constructEvent` at webhook entry (no chained signature failures).
- Raw request body for Stripe signature verification (`rawBody: true` in `main.ts`).
- All flows audit to `stripe_webhook_events` with `metadataFlow`, `checkoutSessionId`, `handler`.
- Deduplicates by Stripe `event.id`.
- Validates `payment_status === paid` before `PAID`.
- Validates amounts (and currency for venue).
- Payment method brand/last4 stored on enrollments/reservations when available.

## Production go-live checklist (real money)

1. Confirm no mixed-mode keys (live sk/pk/whsec together).
2. Run `prisma migrate deploy` on production DB (`start:prod` runs this automatically).
3. Deploy backend and frontend.
4. Test fixed ticket (BUY TICKET), venue seat, and class if used.
5. Verify: `stripe_webhook_events` row, enrollment/reservation `PAID`, customer + admin emails.
6. Re-deliver one processed webhook from Stripe Dashboard — must dedupe (no double charge/email).

## Incident response

### Payment succeeded in Stripe but Shamell shows PENDING

1. Find `checkout.session.completed` for `cs_...` in Stripe → Webhooks → event deliveries.
2. Run SQL above; check `lastError` on webhook row.
3. After fix, **Re-deliver** event in Stripe Dashboard, or call:
   - `POST /api/v1/fixed-event-enrollments/reconcile?session_id=cs_...` (throttled, public)
   - `POST /api/v1/admin/payments/reconcile-fixed-ticket?session_id=cs_...` (admin JWT)
4. Return page polls session-status (triggers reconcile when Stripe is paid but DB pending).

### Webhook instability

1. Endpoint reachable, returns 200 within Stripe timeout.
2. `STRIPE_WEBHOOK_SECRET` matches the Live endpoint that receives events.
3. Table `stripe_webhook_events` exists (migration `20260528220000`, `20260604120000`).

### Suspected key leak

Rotate Stripe keys, update Render/Vercel, redeploy, audit Stripe logs.
