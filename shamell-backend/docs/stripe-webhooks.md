# Stripe webhooks — auditoría y operación

## Endpoint

- **URL:** `POST /api/v1/stripe/webhook`
- **Verificación:** header `stripe-signature` con `STRIPE_WEBHOOK_SECRET` (`whsec_...`)

## Tabla `stripe_webhook_events`

Cada evento de Stripe se registra para idempotencia, reintentos y depuración.

| Campo | Descripción |
|-------|-------------|
| `eventId` | ID único del evento Stripe (`evt_...`) |
| `eventType` | Tipo, p. ej. `checkout.session.completed` |
| `status` | `RECEIVED` → `PROCESSING` → `PROCESSED` o `FAILED` |
| `metadataFlow` | `metadata.flow` de la checkout session |
| `checkoutSessionId` | `cs_...` cuando aplica |
| `handler` | Handler de negocio (`class_session`, `venue_seat`, etc.) |
| `payloadSummary` | Resumen: `type`, `flow`, `paymentStatus`, `amountTotal`, `currency` |
| `processedAt` | Marca de tiempo cuando el handler terminó bien |
| `attempts` | Número de entregas (reintentos Stripe) |
| `lastError` | Último error si `status = FAILED` |

## Configuración local (Stripe CLI)

1. Backend en puerto **3001** con `STRIPE_SECRET_KEY` (test) y `STRIPE_WEBHOOK_SECRET`.
2. En otra terminal:

   ```bash
   stripe listen --forward-to http://localhost:3001/api/v1/stripe/webhook
   ```

3. Copiar el `whsec_...` que imprime la CLI **en esa sesión** a `shamell-backend/.env`.
4. Tras un checkout de prueba, la CLI debe mostrar `200` y en BD debe aparecer una fila con `processedAt` y `handler`.

> El `whsec_` de la CLI **no** es el mismo que el del Dashboard de producción.

## Producción

1. Stripe Dashboard → Developers → Webhooks → añadir endpoint:
   `https://<api-host>/api/v1/stripe/webhook`
2. Copiar el signing secret del endpoint a variables de entorno (`STRIPE_WEBHOOK_SECRET`).
3. Con `NODE_ENV=production`, el backend **no arranca** sin `STRIPE_WEBHOOK_SECRET`.

## Flujos `metadata.flow`

| `flow` | Handler | Tabla de pago |
|--------|---------|---------------|
| `booking_quote` | `booking_quote` | `booking_payments` |
| `class_session` | `class_session` | `upcoming_class_enrollments` |
| `class_package` / `class_session_bundle` / `class_month_package` | mismo valor | `upcoming_class_package_enrollments` |
| `fixed_event_ticket` | `fixed_event_ticket` | `upcoming_fixed_event_enrollments` |
| `venue_seat` | `venue_seat` | `venue_seat_reservations` |

## Admin API

- `GET /api/v1/admin/stripe-webhook-events` — lista paginada (filtros: `eventType`, `metadataFlow`, `checkoutSessionId`, `status`, `processed`, fechas).
- `GET /api/v1/admin/stripe-webhook-events/:eventId` — detalle + `relatedPayments` por `checkoutSessionId`.

UI: `/shamell-admin/agenda/stripe-webhooks`

## Reconciliación si el webhook falló

- Clases: `POST /api/v1/class-enrollments/reconcile` (ver `on-coming-events.md`).
- Fixed tickets: `POST /api/v1/admin/payments/reconcile-fixed-ticket?session_id=cs_...`

## Checklist QA

1. `npx prisma migrate deploy` — tabla y columna `status` visibles en Neon.
2. `.env` con `whsec_` de la sesión activa de `stripe listen`.
3. Pago clase (bundle) → fila en `stripe_webhook_events` + enrollment `PAID`.
4. Reenvío del mismo `eventId` → `deduplicated: true`, sin doble cobro.
5. Firma inválida → `400`, sin `processedAt`.
6. Admin GET lista eventos con `status = FAILED` y `lastError`.
