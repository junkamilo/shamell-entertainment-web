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
| `metadataFlow` | `metadata.flow` de la Checkout Session o, si no hay, del `data.object` (PaymentIntent / Charge / futuros). Sirve para filtrar listados admin |
| `checkoutSessionId` | `cs_...` desde Checkout, `payment_details.order_reference` / `metadata.checkoutSessionId` del PI, o `metadata.checkoutSessionId` del Charge |
| `purchaseCorrelationId` | Id compartido de la compra: `metadata.correlationId` (lo envían al crear Checkout vía `payment_intent_data`: `venue_seat`, `booking_quote`, `class_session`, `class_session_bundle`, `class_session_cart`, `class_month_package`, `fixed_event_ticket`, y checkouts admin de clase) o, si no hay, `checkoutSessionId`. Filtra los N eventos de un mismo pago |
| `handler` | Negocio (`class_session`, `venue_seat`, …) o `audit_only` (timeline) |
| `payloadSummary` | Resumen JSON compacto para listados: `type`, `flow`, `checkoutSessionId`, `paymentIntentId`, `chargeId`, `paymentStatus` / `stripeStatus`, `amount` / `amountTotal`, `currency` (+ `refunded` en charges) |
| `payload` | Cuerpo Stripe `event.data` (`object` + `previous_attributes`), mismos campos que el Events Dashboard. Secretos redactados (`client_secret` → `[redacted]`). El orden de claves puede diferir; el contenido es el del webhook. |
| `processedAt` | Marca de tiempo cuando el handler terminó bien |
| `attempts` | Número de entregas (reintentos Stripe) |
| `lastError` | Último error si `status = FAILED` |

**Redacción:** antes del upsert, `payload` pasa por `redactStripePayload` (claves `client_secret`, `secret`, `secrets` → `[redacted]`). Nunca persistir secretos de Stripe en Neon. El detalle admin (`GET …/stripe-webhooks/:eventId`) expone `payload`; el listado sigue usando solo `payloadSummary`.

**Checkout outbound (para que timeline herede flow/correlation):** estos flujos crean Checkout con `payment_intent_data` (`description`, `receipt_email`, `metadata.flow`, `metadata.correlationId`) y luego actualizan el PI con `checkoutSessionId` (+ ids de negocio: `enrollmentId` / `packageEnrollmentId`):

- `venue_seat`
- `booking_quote`
- `class_session` / `class_session_bundle` / `class_session_cart` / `class_month_package` (público + admin box-office)
- `fixed_event_ticket` (público)

Así `payment_intent.*` / `charge.*` traen metadata en el snapshot de Stripe y las columnas `metadataFlow` / `purchaseCorrelationId` se llenan en los ~5 eventos de la compra.

## Eventos: negocio vs timeline (audit-only)

| Evento Stripe | ¿Fila en `stripe_webhook_events`? | ¿Cambia PAID / EXPIRED? | `handler` |
|---------------|-----------------------------------|-------------------------|-----------|
| `checkout.session.completed` | Sí | Sí (PAID vía `metadata.flow`) | `venue_seat`, `class_session`, … |
| `checkout.session.expired` | Sí | Sí (EXPIRED) | mismo |
| `payment_intent.created` | Sí | No | `audit_only` |
| `payment_intent.succeeded` | Sí | No | `audit_only` |
| `payment_intent.payment_failed` | Sí | No | `audit_only` |
| `charge.succeeded` | Sí | No | `audit_only` |
| `charge.updated` | Sí | No | `audit_only` |
| `charge.failed` | Sí | No | `audit_only` |
| `charge.refunded` | Sí | No (fase 1: solo timeline) | `audit_only` |

- **Fuente de verdad de negocio:** solo Checkout completed/expired.
- **Timeline:** PI/charge se auditan con HTTP 200 y `handler = audit_only` (no tocan enrollments/reservas).
- Otros tipos no listados → `FAILED` + 400 (no se tragan eventos futuros sin decisión explícita).

## Dashboard — eventos a suscribir (Test y Live)

En el destination del webhook, suscribir **al menos**:

1. `checkout.session.completed`
2. `checkout.session.expired`
3. `payment_intent.created`
4. `payment_intent.succeeded`
5. `payment_intent.payment_failed`
6. `charge.succeeded`
7. `charge.updated`
8. `charge.failed`
9. `charge.refunded`

Endpoint URL:

- Local (túnel): `https://<ngrok-host>/api/v1/stripe/webhook` → Nest en **puerto 3001** (no el frontend 3000).
- Producción: `https://<api-host>/api/v1/stripe/webhook`

Copiar el **Signing secret** (`whsec_...`) del destination activo a `STRIPE_WEBHOOK_SECRET` y reiniciar el API.

## Configuración local (Stripe CLI)

1. Backend en puerto **3001** con `STRIPE_SECRET_KEY` (test) y `STRIPE_WEBHOOK_SECRET`.
2. En otra terminal:

   ```bash
   stripe listen --forward-to http://localhost:3001/api/v1/stripe/webhook
   ```

3. Copiar el `whsec_...` que imprime la CLI **en esa sesión** a `shamell-backend/.env`.
4. Tras un checkout de prueba, la CLI debe mostrar `200` y en BD deben aparecer filas (Checkout + PI/charge si el listen reenvía esos tipos) con `processedAt`.

> El `whsec_` de la CLI **no** es el mismo que el del Dashboard de producción.

## Producción

1. Stripe Dashboard → Developers → Webhooks → añadir endpoint:
   `https://<api-host>/api/v1/stripe/webhook`
2. Suscribir la matriz de eventos de arriba.
3. Copiar el signing secret del endpoint a variables de entorno (`STRIPE_WEBHOOK_SECRET`).
4. Con `NODE_ENV=production`, el backend **no arranca** sin `STRIPE_WEBHOOK_SECRET`.

## Flujos `metadata.flow`

| `flow` | Handler | Tabla de pago |
|--------|---------|---------------|
| `booking_quote` | `booking_quote` | `booking_payments` |
| `class_session` | `class_session` | `upcoming_class_enrollments` |
| `class_package` / `class_session_bundle` / `class_session_cart` / `class_month_package` | mismo valor | `upcoming_class_package_enrollments` |
| `fixed_event_ticket` | `fixed_event_ticket` | `upcoming_fixed_event_enrollments` |
| `venue_seat` | `venue_seat` | `venue_seat_reservations` |

## Admin API

- `GET /api/v1/admin/stripe-webhook-events` — lista paginada (filtros: `eventType`, `metadataFlow`, `checkoutSessionId`, `purchaseCorrelationId`, `status`, `processed`, fechas).
- `GET /api/v1/admin/stripe-webhook-events/:eventId` — detalle + `relatedPayments` por `checkoutSessionId`.

UI: `/shamell-admin/agenda/stripe-webhooks`

## Reconciliación si el webhook falló

- Clases: `POST /api/v1/class-enrollments/reconcile` (ver `on-coming-events.md`).
- Fixed tickets: `POST /api/v1/admin/payments/reconcile-fixed-ticket?session_id=cs_...`
- Venue seats: return page / `session-status` puede soft-reconciliar PAID sin depender del webhook (la auditoría timeline sigue siendo independiente).

## Checklist QA

1. `npx prisma migrate deploy` — tabla y columna `status` visibles en Neon.
2. `.env` con `whsec_` del destination / `stripe listen` activo.
3. Destination suscrito a Checkout + PI/charge (matriz arriba); túnel → **3001**.
4. Pago test → filas `checkout.session.completed` (`handler` de negocio) + PI/charge (`handler = audit_only`).
5. Reenvío del mismo `eventId` → `deduplicated: true`, sin doble cobro.
6. Firma inválida → `400`, sin fila útil / sin `processedAt` nuevo.
7. Admin GET lista eventos con `status = FAILED` y `lastError` solo para unhandled reales (no para audit-only).

## QA seguridad no funcional

Checklist verificable (CI + manual). Filtrar tests: `npx jest -t "security checklist"`.

| Ítem | Cómo verificar | Pass |
|------|----------------|------|
| POST webhook sin `stripe-signature` → 400 | Deep e2e `test/stripe-webhook-dispatch-flows.e2e-spec.ts` + unit dispatch | `Missing stripe-signature header.` |
| Firma inválida / body alterado → 400 | Mismo e2e (`invalid signature` / `altered body`) | `Invalid stripe-signature header.`; sin `trackAttempt` |
| Evento `livemode:false` + `NODE_ENV=production` → 400 | Unit + deep e2e security checklist | Mensaje test-mode rejected; handlers no llamados |
| `amount_subtotal` ≠ DB → no PAID | `upcoming-events-webhook.service.spec.ts` (class + package/cart) | `BadRequestException`; `mark*Paid` **not** called |
| Replay mismo `eventId` → `deduplicated: true` | Unit + deep e2e | Sin doble handler de dominio |
| Admin sin JWT → 401 list/detail | `test/admin-stripe-webhooks.e2e-spec.ts` (guard real) | HTTP **401** (no stub 403) |
| `payload.client_secret` = `[redacted]` | `stripe-webhook.types.spec.ts` + dispatch `trackAttempt` | Valor `[redacted]` en persistencia |
| Secretos no en repo/logs | CI gitleaks + `.gitignore` (`.env`) | PR falla si hay `sk_`/`whsec_` tracked; nunca loguear secretos |
| Reconcile `session_id` inventado no crea enrollments | `upcoming-events-webhook.service.spec.ts` security reconcile | Retrieve fail / unpaid → cero `mark*Paid` / creates |

### Manual (ops)

- Confirmar en Neon un evento reciente: `payload` sin `client_secret` en claro.
- Rotar `STRIPE_WEBHOOK_SECRET` / `STRIPE_SECRET_KEY` solo vía env (Dashboard / host); no pegar en tickets ni logs.
- Endpoint Stripe Dashboard apunta a `POST /api/v1/stripe/webhook` con signing secret de producción.
