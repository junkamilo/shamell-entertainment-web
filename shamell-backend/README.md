<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Shamell Entertainment backend — NestJS API for bookings, venue seating, class tickets, Stripe Checkout, and admin CMS.

## Project runbooks

- Stripe live payments: `docs/stripe-live-runbook.md`

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Testing (QA pyramid)

| Layer | What it covers | How to run |
|-------|----------------|------------|
| **Unit** | Controllers/services/repos/utils with mocks (Jest) | `npm run test` |
| **Integration** | Module + real DB when gated env flags are set | included in `npm run test` (skipped without DB flags) |
| **E2E** | HTTP smoke / contracts (`test/*.e2e-spec.ts`) | `npm run test:e2e` |
| **Coverage** | Line/branch metrics over production `src/` | `npm run test:cov` |

```bash
# unit (+ gated integration)
$ npm run test

# e2e smoke
$ npm run test:e2e

# coverage report (text + coverage/)
$ npm run test:cov

# upcoming-events module coverage (deep QA focus)
$ npm run test:cov:upcoming

# venue-reservations module coverage (deep QA focus)
$ npm run test:cov:venue-reservations

# bookings module coverage (deep QA focus)
$ npm run test:cov:bookings

# auth module coverage (deep QA focus)
$ npm run test:cov:auth

# availability module coverage (deep QA focus)
$ npm run test:cov:availability

# events module coverage (deep QA focus)
$ npm run test:cov:events

# contact module coverage (deep QA focus)
$ npm run test:cov:contact

# standalone-chairs module coverage (deep QA focus)
$ npm run test:cov:standalone-chairs

# venue-tables module coverage (deep QA focus)
$ npm run test:cov:venue-tables

# gallery module coverage (deep QA focus)
$ npm run test:cov:gallery

# floor-layout module coverage (deep QA focus)
$ npm run test:cov:floor-layout

# header-media module coverage (deep QA focus)
$ npm run test:cov:header-media

# services module coverage (deep QA focus)
$ npm run test:cov:services

# venue-layout-settings module coverage (deep QA focus)
$ npm run test:cov:venue-layout-settings

# gated class-session regenerate integration (requires DATABASE_URL)
$ CLASS_SESSION_INTEGRATION=1 npm test -- upcoming-events.integration --runInBand

# gated venue availability integration (requires DATABASE_URL)
$ VENUE_RESERVATIONS_INTEGRATION=1 npm test -- venue-reservations.integration --runInBand

# gated bookings occupied + overlap conflict (requires DATABASE_URL)
$ BOOKINGS_INTEGRATION=1 npm test -- bookings.integration --runInBand

# gated auth login (requires DATABASE_URL)
$ AUTH_INTEGRATION=1 npm test -- auth.integration --runInBand
```

### Coverage baseline (unit suite)

Measured with `npm run test:cov` after closing payment/webhook util gaps (Jest excludes `*.module.ts`, `main.ts`, `__mocks__`, `*.dto.ts`, `testing/`, specs):

| Metric | Baseline |
|--------|----------|
| Statements | **57.31%** |
| Branches | **41.55%** |
| Functions | **56.33%** |
| Lines | **57.40%** |

Internal target: keep **Lines ≥ 57%** on subsequent PRs. Coverage is an objective line metric — file pairing and e2e smoke are complementary, not the same as “functional” black-box coverage.

### Controllers deep QA (facades)

Thin HTTP facades over services — logic stays in services; controllers are protected by **typed unit delegation + contract e2e** (validation branches `session_id`/`token`, auth gates, happy paths). Measure via module `test:cov:*` (controller rows) + `test/*.e2e-spec.ts`.

| Controller | Baseline stmts / branch | Medido stmts / branch | Target |
|------------|-------------------------|-----------------------|--------|
| `upcoming-events.controller.ts` | **~57% / ~62%** | **100% / ~79%** | **≥90% / ≥75%** |
| `bookings.controller.ts` | **~59% / ~58%** | **100% / ~80%** | **≥90% / ≥75%** |
| `venue-reservations.controller.ts` | **~55% / ~50%** | **100% / ~82%** | **≥90% / ≥75%** |

**E2E contract gaps closed:** admin sessions CRUD + venue-config + public sessions + fixed session-status (upcoming); private-class + calendar + GET `:id` + quote reconcile + deprecated 410 webhook (bookings); admin availability + PDF + resend + `public/pay/reconcile` (venue).

### Events deep QA

Pirámide tipada para catálogo público / contact-lines / admin CRUD / occasion types / hub enrich (sin Stripe; no es módulo de dinero):

| Layer | Focus |
|-------|--------|
| **Unit service** | create/conflict/channel, update disable+rename, delete booking/seat/class guards, public + contact-lines, event-type CRUD + occasion sync, occasion admin CRUD, hub FIXED/VENUE/CLASSES enrich |
| **E2E contratos** | HTTP matrix with service mocks + typed bodies + `x-request-id` on errors |
| **E2E admin-flows** | Real `EventsService` + mocked repo/gallery vía HTTP (events, types, occasions, hub list) |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `events.service.ts` statements | **~55%** | **100%** | **≥70%** |
| `events.service.ts` branches | **~45%** | **85.21%** | **≥55%** |
| `src/modules/events/**` statements | **~60%** | **83.97%** | **≥65%** |

Measure with `npm run test:cov:events` (excludes `*.module.ts`, `*.dto.ts`, `__mocks__`, `testing/`, specs). No global `coverageThreshold`.

**Notes:** Delete/disable guards throw `ConflictException` (**409**), not 400. `publicSection` is immutable after create (`BadRequestException` 400). Gallery image upload (`POST admin/:id/images`) stays on `GalleryService` (out of this wave). No god-service split: module already has `EventsRepository`; deep QA expands kit/unit/e2e tipados without changing public API. Residual branch noise is mostly optional DTO spread arms on update.

### Upcoming events deep QA

Pirámide tipada para enrollment / sesiones / pago (no 100% de cada helper privado de mail/PDF):

| Layer | Focus |
|-------|--------|
| **Unit utils** | `class-session-generator`, overlap/package helpers |
| **Unit service** | checkout, cupos, webhook/reconcile, regenerate admin |
| **E2E contratos** | HTTP matrix with service mocks + typed bodies |
| **E2E class-flows** | Real `UpcomingEventsService` + mocked prisma/Stripe |
| **Integration gated** | `CLASS_SESSION_INTEGRATION=1` regenerate idempotency + section off |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `upcoming-events.service.ts` statements | ~**11%** | **79.1%** | **≥70%** |
| `src/modules/upcoming-events/**` statements | — | **76.79%** | **≥65%** |

Measure with `npm run test:cov:upcoming` (excludes `*.module.ts`, `*.dto.ts`, `__mocks__`, `testing/`, specs). No global `coverageThreshold` that would break CI.

**Facade split:** `UpcomingEventsService` is now a thin facade (public method names/signatures unchanged) delegating to `UpcomingEventsPublicService`, `UpcomingEventsCheckoutService`, `UpcomingEventsWebhookService`, `UpcomingEventsAdminSessionsService`, and `UpcomingEventsVenueConfigService`; shared queries live on `UpcomingEventsRepository`. No new coverage thresholds from this split.

#### Upcoming events repository deep QA

Centralización Prisma → named methods on `UpcomingEventsRepository` (webhook → checkout/public → admin), then pirámide tipada kit → unit repo matrix → deep e2e con **repositorio real**.

| Layer | Focus |
|-------|--------|
| **Unit repository** | find/mark/create/count/seats/tx helpers (class, package, fixed, admin sessions, venue config) |
| **E2E class-flows** | Real `UpcomingEventsRepository` + prisma mock (checkout → reconcile) |
| **E2E repository-flows** | Real repo + webhook via `POST /api/v1/stripe/webhook` tipado |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `upcoming-events.repository.ts` statements | **~26%** | **99.09%** | **≥90%** |
| `upcoming-events.repository.ts` branches | thin | **82.14%** | **≥75%** |

Measure with `npm run test:cov:upcoming`. **Notes:** cobertura repo viene de unit (contact pattern); deep e2e tipado protege contratos HTTP con stack real. `asPrisma()` solo para utils (`class-session-generator`, `fixedTicketsRemaining`, `resolveMonthSessions`, etc.). Firmas de fachada y `{ handled }` intactas. No Stripe live.

#### Upcoming events webhook deep QA

Pirámide tipada (kit + unit money-matrix + deep e2e vía Stripe dispatch) para `upcoming-events-webhook.service.ts`. Bodies e2e tipados sin `any`.

| Layer | Focus |
|-------|--------|
| **Unit webhook** | class/package/fixed paid, idempotent, unpaid, missing, amount mismatch, expire, mail fail, sold-out-after-pay, reconcile/status, deprecated handlers |
| **E2E webhook-flows** | Real `UpcomingEventsWebhookService` vía `POST /api/v1/stripe/webhook` + `StripeWebhookDispatchService` |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `upcoming-events-webhook.service.ts` statements | **72.45%** | **95.08%** | **≥90%** |
| `upcoming-events-webhook.service.ts` branches | **56.79%** | **78.6%** | **≥75%** |

Measure with `npm run test:cov:upcoming`. **Producto:** fallo de mail no reintenta ni revierte PAID; amount mismatch → `BadRequestException` (dispatch marca failed); idempotencia = early return si ya `PAID`. No Stripe live / refunds. Retorno de process* permanece `{ handled: boolean }`.

#### Upcoming events checkout deep QA

Pirámide tipada (kit + unit money-matrix + deep e2e HTTP) para `upcoming-events-checkout.service.ts` (class / bundle / month package / fixed). Bodies e2e tipados sin `any` / `as never`. Helpers privados (`assertClassesExperience`, `createEmbeddedCheckoutSession`, `attachCheckoutFlowMetadata`, `createPackageChildrenEnrollments`) no cambian firmas públicas de fachada/checkout.

| Layer | Focus |
|-------|--------|
| **Unit checkout** | 4 flows: happy, validation, sold-out, missing `client_secret` |
| **E2E checkout-flows** | Real checkout + repo vía HTTP tipado (`upcoming-events-checkout-flows.e2e-spec.ts`) |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `upcoming-events-checkout.service.ts` statements | **~89%** | **98.65%** | **≥90%** |
| `upcoming-events-checkout.service.ts` branches | **~70%** | **85.41%** | **≥75%** |

Measure with `npm run test:cov:upcoming`. **Producto:** sold-out → `ConflictException` 409; validaciones → `BadRequestException` / `NotFoundException`; missing Stripe `client_secret` → 400. Nota: el brazo fixed `amountCents < 50` post-assert es inalcanzable tras `priceOk >= 0.5` (no forzar cobertura). No Stripe live.

#### Util `upcoming-purchase-mode.util`

Unit coverage for `resolveUpcomingPurchaseContext`: date-only window rescue (`not_started` / `ended`), TZ fallback, invalid TZ catch, `priceOk` &lt; 0.5, classes without sessions, venue window closed.

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `upcoming-purchase-mode.util.ts` statements | ~**60%** | **100%** | **≥98%** |

Measure via `npm run test:cov:upcoming`. Residual branch gap: `not_started`/`ended` OR (one arm).

### Admin class enrollment deep QA

Pirámide tipada para inscripción admin cash / Stripe pay-link / cupos / day_bundle / month_package:

| Layer | Focus |
|-------|--------|
| **Unit service** | cash happy/full/ended, session+package checkout payUrl, day_bundle/month_package resolve validations, pay-token edges |
| **E2E contratos** | admin auth + booking-context + pay checkout tipados |
| **E2E admin-class-flows** | Real `AdminClassEnrollmentService` + mocked prisma/Stripe (cash + session/package checkout) |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `admin-class-enrollment.service.ts` statements | ~**12%** | **95.54%** | **≥55%** |
| `admin-class-enrollment.service.ts` branches | **~67%** | **72.82%** | **≥70%** |

#### Util `admin-bookable-class.util` / `class-month-package.util`

Unit + deep e2e (`upcoming-events-admin-class-flows`) for readiness (`no_weekdays` / `no_sections`), template snapshots, and month-package empty/full session guards.

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `admin-bookable-class.util.ts` statements | ~**75%** | **100%** | **≥95%** |
| `class-month-package.util.ts` statements | ~**90%** | **100%** | **≥98%** |

Measure with `npm run test:cov:upcoming`.

**Note:** There is no duplicate-customer (“usuario ya inscrito”) gate by email+session; capacity/full/ended are the conflict matrix. Adding email uniqueness would be a separate product change.

### Admin fixed-event enrollment deep QA

Pirámide tipada espejo de admin-class para box-office fixed tickets (`listBoxOfficeFixedEvents` / `createAdminCash` / `createAdminCheckoutSession`):

| Layer | Focus |
|-------|--------|
| **Unit service** | cash PAID+ticket#/mail, checkout payUrl+PENDING, sold-out, inactive/not-fixed, capacity/price, list box-office |
| **E2E contratos** | admin auth + cash/checkout/list stub tipados + sold-out 409; reconcile tipado en UpcomingEvents |
| **E2E admin-fixed-flows** | Real `AdminFixedEventEnrollmentService` + mocked prisma/Stripe/mail |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `admin-fixed-event-enrollment.service.ts` statements | ~**23%** | **96.15%** | **≥55%** |

Measure with `npm run test:cov:upcoming`. **Notes:** admin path gates on `isActive` + FIXED_EVENT / `!clientEnabled` / capacity / price — there is **no** cancelled/ended check on the admin fixed path (product gap). Cash confirmation mail lives here; Stripe post-pay confirm is `UpcomingEventsService.markFixedEnrollmentPaid` / `reconcileFixedTicketFromStripeSession` (covered in UpcomingEvents unit + contract e2e).

### Venue reservations deep QA

Pirámide tipada para disponibilidad / checkout / pago fallido / webhook idempotente / expire / cancel status-only / sold-out (no Stripe refund — cancel es status-only):

| Layer | Focus |
|-------|--------|
| **Unit utils** | canonical event night, seat labels, PDF/share |
| **Unit service** | unpaid/mismatch webhook, expire no-ops, pay-token TTL, cancel idempotent, sold-out/window, admin availability/list/resend/PDF, chair path |
| **E2E contratos** | HTTP matrix tipada (auth, cash/checkout, sold_out, pay expired, webhook handled) |
| **E2E seat-flows** | Real `VenueReservationsService` + mocked prisma/Stripe (unpaid reconcile, expire, cancel idempotent, admin cash/checkout, sold-out) |
| **Integration gated** | `VENUE_RESERVATIONS_INTEGRATION=1` availability + reserved seat |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `venue-reservations.service.ts` statements | ~**69%** | **87.5%** | **≥85%** |
| `venue-reservations.service.ts` branches | ~**50%** | **65.4%** | documentado |
| `resolve-canonical-reservation-event-date.util.ts` statements | ~**94%** | **100%** | **≥98%** |
| `src/modules/venue-reservations/**` statements | — | **87.66%** | **≥65%** |

Measure with `npm run test:cov:venue-reservations` (excludes `*.module.ts`, `*.dto.ts`, `__mocks__`, `testing/`, specs). No global `coverageThreshold`.

**Note:** There is no Stripe refund path (partial or full) in this module; `cancelAdminReservation` sets `CANCELLED` and notifies admin only. Refunds would be a separate product change. Canonical util covers non-FIXED missing night → `Reservations are not configured.` and `storedEventDate` fallback (deep e2e checkout 400).

### Stripe webhook dispatch deep QA

Pirámide tipada para el dispatcher unificado (`constructEvent` → dedupe → `metadata.flow` → domain handler / unhandled + audit):

| Layer | Focus |
|-------|--------|
| **Unit dispatch** | invalid sig, flow matrix (booking/class/package/fixed/venue + expired), `payment_intent.succeeded` unhandled, markFailed, reprocess |
| **Unit retry** | stale FAILED batch → `reprocessFromStripeEventId`; continue on throw |
| **E2E contratos** | HTTP stub success / unhandled tipados |
| **E2E dispatch-flows** | Real `StripeWebhookDispatchService` + mocked Stripe/audit/domain over HTTP |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `stripe-webhook-dispatch.service.ts` statements | ~**36%** | **100%** | **≥85%** |
| `stripe-webhook-dispatch.service.ts` branches | — | **87.3%** | documentado |

Measure with `npm run test:cov:venue-reservations`. **Note:** `payment_intent.succeeded` is **not** a success path in dispatch (no session/`metadata.flow`); it becomes unhandled 400 + `markFailed` by design. Only `checkout.session.completed` / `expired` with known flows are routed.

#### Stripe webhook audit deep QA

Unit tipado para persistencia de auditoría (`isProcessed` / `trackAttempt` / `markProcessing` / `markProcessed` / `markFailed`):

| Layer | Focus |
|-------|--------|
| **Unit audit** | processed flags, upsert defaults + metadata retry, markProcessing, markFailed Error/string + update-fail log |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `stripe-webhook-audit.service.ts` statements | **~89%** | **100%** | **≥90%** |
| `stripe-webhook-audit.service.ts` branches | **~55%** | **93.1%** | **≥75%** |

Measure via `npx jest modules/stripe/services/stripe-webhook-audit.service.spec.ts --coverage --collectCoverageFrom="modules/stripe/services/stripe-webhook-audit.service.ts"`. Dispatch e2e keeps audit mocked; no Stripe live.

### Bookings admin deep QA

Pirámide tipada para create / status (CONFIRMED|CANCELLED) / slots / catalog / quote pricing (sin approve/reject ni discount dedicados):

| Layer | Focus |
|-------|--------|
| **Unit admin** | create, update status, cancel side effects, slot conflict, catalog |
| **Unit quote** | FULL/DEPOSIT totals, deposit/balance guards, balance link |
| **E2E contratos** | HTTP matrix with service mocks + typed bodies |
| **E2E admin-flows** | Real `BookingsAdminService` + mocked repo/availability/mail |
| **Integration gated** | `BOOKINGS_INTEGRATION=1` occupied window + overlap conflict + quote FULL total |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `bookings-admin.service.ts` statements | ~**17%** | **79.8%** | **≥55%** |
| `src/modules/bookings/**` statements | — | **65.8%** | **≥65%** |

Measure with `npm run test:cov:bookings` (excludes `*.module.ts`, `*.dto.ts`, `__mocks__`, `testing/`, specs). No global `coverageThreshold`.

**Note:** There is no dedicated approve/reject API — status is set via `PATCH admin/:id`. There is no discount code path in bookings; pricing lives in `BookingsQuoteService` (FULL/DEPOSIT only).

### Bookings quote deep QA

Pirámide tipada para create FULL/DEPOSIT, expiración de token (72h), checkout/reissue (45m Stripe TTL) y reconcile de session-status:

| Layer | Focus |
|-------|--------|
| **Unit quote** | create/re-quote, token expiry → EXPIRED, checkout open/reissue/paid, session reconcile |
| **E2E contratos** | balance-link auth, pay redirect, checkout, session-status tipados |
| **E2E quote-flows** | Real `BookingsQuoteService` + mocked repo/Stripe/webhook |
| **Integration gated** | `BOOKINGS_INTEGRATION=1` createBookingQuote FULL escribe `quoteTotalAmount` (Stripe mock) |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `bookings-quote.service.ts` statements | ~**20%** | **93.7%** | **≥70%** |
| `src/modules/bookings/**` statements | — | **70.1%** | **≥65%** |

Measure with `npm run test:cov:bookings`. No global `coverageThreshold`.

**Notes:** Quote totals are admin-entered scalars (`totalAmount` / `depositAmount`) — not derived from `bookingServices` line items. There is no auto-recalc when services change; admin sends a new quote (cancels pending payments and overwrites totals). Expiry is enforced on checkout resolve (`tokenExpiresAt`); expired Stripe sessions are reissued.

### Bookings inquiry deep QA

Pirámide tipada para `preparePublicBookingInquiry` / `createFromPublicBookingInquiry` (contacto público → booking RESERVED):

| Layer | Focus |
|-------|--------|
| **Unit inquiry** | happy path, null guards (phone/location/eventDate/service), availability/duplicate/invalid date, catalog refs, notify delegate |
| **E2E inquiry-flows** | Real `BookingsInquiryService` + real `BookingsAdminService` + mocked repo/availability/mail |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `bookings-inquiry.service.ts` statements | ~**40%** | **98.5%** | **≥80%** |

Measure with `npm run test:cov:bookings`. Typed DTO bodies in unit + `test/bookings-inquiry-flows.e2e-spec.ts` (no `any`).

### Bookings webhook deep QA

Pirámide tipada para `checkout.session.completed` / `expired` con `metadata.flow=booking_quote` (DEPOSIT / FULL / BALANCE, amount assert, mail, expire):

| Layer | Focus |
|-------|--------|
| **Unit webhook** | paid DEPOSIT/FULL/BALANCE, amount mismatch, unpaid session, idempotent PAID, expire PENDING→EXPIRED, mail skip/missing |
| **E2E webhook-flows** | Real `BookingsWebhookService` via Stripe dispatch HTTP + mocked repo/mail |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `bookings-webhook.service.ts` statements | ~**29%** | **96.9%** | **≥85%** |

Measure with `npm run test:cov:bookings`. Routed only when `flow=booking_quote`; other flows return `handled: false` at the webhook service (dispatch may still 400 if unhandled).

### Auth deep QA

Pirámide tipada para login / invite / verify / forgot-reset / Google / bootstrap (**sin refresh token API**):

| Layer | Focus |
|-------|--------|
| **Unit service** | login staff/2FA, invite/verify, forgot/reset, Google bind, bootstrap |
| **E2E contratos** | HTTP matrix tipada + `x-request-id` |
| **E2E admin-flows** | Real `AuthService` + mocked repo/mail/jwt |
| **Integration gated** | `AUTH_INTEGRATION=1` login against DB |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `auth.service.ts` statements | ~**38%** | **88.4%** | **≥55%** |
| `src/modules/auth/**` statements | — | **83.5%** | **≥60%** |

Measure with `npm run test:cov:auth`. **Note:** There is no refresh-token endpoint; access JWT is issued on login only.

### Bookings repository deep QA

Unit prisma-mock centered on **multi-write transactions** (not HTTP e2e to the repository):

| Layer | Focus |
|-------|--------|
| **Unit repository** | create/update/remove admin txs, inquiry insert, private-class create, quote/payment helpers |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `bookings.repository.ts` statements | ~**19%** | **76.71%** | **≥45%** |
| `bookings.repository.ts` branches | **~86%** | **95.45%** | **≥85%** |
| `src/modules/bookings/**` statements | — | **85.56%** | **≥65%** |

Thin Prisma finds + `excludeId` / null-contact remove arms covered in unit. Measure with `npm run test:cov:bookings`.

### Availability deep QA

Pirámide tipada para reglas públicas / weekly slots / closures / assertDateTimeAllowed:

| Layer | Focus |
|-------|--------|
| **Unit service** | putWeeklySlots, createClosure (SPECIFIC_DATE / DATE_RANGE / RECURRING_WEEKDAY), removeClosure, assertDateTimeAllowed |
| **E2E contratos** | HTTP matrix with service mocks + typed bodies + auth gates |
| **E2E admin-flows** | Real `AvailabilityService` + mocked repo via HTTP |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `availability.service.ts` statements | ~**71%** | **95.45%** | **≥80%** |
| `src/modules/availability/**` statements | — | **90.75%** | **≥80%** |

Measure with `npm run test:cov:availability` (excludes `*.module.ts`, `*.dto.ts`, `__mocks__`, `testing/`, specs). No global `coverageThreshold`.

**Notes:** Missing weekly DB rows are treated as fully open (00:00–23:59) unless blocked by a closure. Closures cover SPECIFIC_DATE, DATE_RANGE, and RECURRING_WEEKDAY.

### Contact deep QA

Pirámide tipada para booking inquiry / concierge / dedupe / availability / inbox (peticiones):

| Layer | Focus |
|-------|--------|
| **Unit service** | create booking/concierge, dedupe, availability reject, updateStatus, remove CANCELLED-only, findAll/peticiones |
| **Unit inbox** | badge `since` edges; guidance / private_classes / bookings empty+hydrate lanes (typed DTO, no `as never`) |
| **Unit repository** | peticiones feeds/counts (`$queryRaw`), dedupe finds, event/occasion lookups |
| **E2E contratos** | HTTP matrix with service mocks + typed bodies |
| **E2E inquiry-flows** | Real `ContactService` + mocked repo/availability/mail/bookings |
| **Integration gated** | `CONTACT_INTEGRATION=1` findOne / badge against real DB |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `contact.service.ts` statements | ~**65%** | **80.68%** | **≥75%** |
| `contact-inbox.service.ts` statements | **~79%** | **100%** | **≥90%** |
| `contact-inbox.service.ts` branches | **~59%** | **96.29%** | **≥75%** |
| `contact.repository.ts` statements | ~**51%** | **100%** | **≥80%** |
| `src/modules/contact/**` statements | — | **88.11%** | **≥65%** |

Measure with `npm run test:cov:contact` (excludes `*.module.ts`, `*.dto.ts`, `__mocks__`, `testing/`, specs). No global `coverageThreshold`.

**Notes:** Booking-inquiry entry sources (`contact_page` / `home_service_card` / `inquire_section`) materialize a booking inside a transaction; `concierge_gate` is ack-only with vision snapshot. Dedupe is same guest/day or recent contact with an active booking (`BOOKING_INQUIRY_DEDUPE_MS`). Delete is hard-delete of `CANCELLED` rows only.

### Standalone chairs deep QA

Pirámide tipada para inventario público / admin upsert / price patch / delete + layout sync (sin Stripe):

| Layer | Focus |
|-------|--------|
| **Unit service** | upsert increase/reduce (floor-block), legacy materialize, patch/bulk-price reserved blocks, delete/deleteAll + layout sync |
| **E2E contratos** | HTTP matrix with service mocks + typed bodies + auth gates |
| **E2E admin-flows** | Real `StandaloneChairsService` + mocked repo/floor-layout via HTTP |
| **Integration gated** | `STANDALONE_CHAIRS_INTEGRATION=1` upsert → public list → deleteAll |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `standalone-chairs.service.ts` statements | ~**52%** | **94.57%** | **≥55%** |
| `standalone-chairs.repository.ts` statements | ~**51%** | **95.74%** | **≥80%** |
| `src/modules/standalone-chairs/**` statements | — | **94.2%** | **≥55%** |

Measure with `npm run test:cov:standalone-chairs` (excludes `*.module.ts`, `*.dto.ts`, `__mocks__`, `testing/`, specs). No global `coverageThreshold`.

**Notes:** Reducing quantity rejects when chairs are placed on the On Coming Events floor plan. Paid reservations block price edits and deletes; layout item cleanup runs before chair row deletes. Legacy configs with `availableQuantity > 0` and zero chair rows are materialized on public/admin read. Repository deep QA covers public/desc finds, bulk create/delete, config quantity, and layout helpers via prisma-mock + admin-flows.

### Venue tables deep QA

Pirámide tipada para create / bulkCreate (name conflict) / update size-rename / bulk price / delete floor-block / bulkDelete:

| Layer | Focus |
|-------|--------|
| **Unit service** | create, bulkCreate + name conflict, update size/rename + clamp chairs, bulk price, delete floor-block, bulkDelete |
| **E2E contratos** | HTTP matrix with service mocks + typed bodies |
| **E2E admin-flows** | Real `VenueTablesService` + mocked repo/floor-layout |
| **Integration gated** | `VENUE_TABLES_INTEGRATION=1` create against real DB |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `venue-tables.service.ts` statements | ~**36%** | **100%** | **≥55%** |
| `src/modules/venue-tables/**` statements | — | **80.32%** | **≥55%** |

Measure with `npm run test:cov:venue-tables` (excludes `*.module.ts`, `*.dto.ts`, `__mocks__`, `testing/`, specs). No global `coverageThreshold`.

**Notes:** Soft-delete sets `isActive: false`. Tables placed on the On Coming Events floor plan cannot be deleted until removed from the layout. Size changes regenerate the technical `tableName` and clamp `includedChairs` to the new size limits.

### Venue tables mapper deep QA

Pirámide tipada para util puro `mapVenueTableRow` / `parseLayoutItems` / `decimalToNumber`:

| Layer | Focus |
|-------|--------|
| **Unit mapper** | Decimal→number, coords null/{x,y}, catalog_table + standalone_chair parse, skip inválidos, default `chairName` |
| **E2E contratos** | `VenueTableBody.visualCoordinates` null vs coords tipados |
| **E2E admin-flows** | Real service GET by id con coords mapeadas |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `venue-tables-mapper.util.ts` statements | ~**31%** | **100%** | **≥95%** |
| `venue-tables-mapper.util.ts` branches | — | **100%** | documentado |

Measure with `npm run test:cov:venue-tables`.

### Gallery deep QA

Pirámide tipada para categorías / fotos públicas + admin (CDN upload cleanup, refs, P2002):

| Layer | Focus |
|-------|--------|
| **Unit service** | create/update category (slug + P2002), photo create/update/delete + CDN cleanup, event-catalog env/slug paths, reference guards |
| **E2E contratos** | HTTP matrix with service mocks + typed bodies + `x-request-id` on errors |
| **E2E admin-flows** | Real `GalleryService` + mocked repo/media via HTTP |
| **Integration gated** | `GALLERY_INTEGRATION=1` against real DB |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `gallery.service.ts` statements | ~**67%** | **94.35%** | **≥80%** |
| `src/modules/gallery/**` statements | — | **84.72%** | **≥80%** |

Measure with `npm run test:cov:gallery` (excludes `*.module.ts`, `*.dto.ts`, `__mocks__`, `testing/`, specs). No global `coverageThreshold`.

**Notes:** Invalid `serviceId` / `eventId` (and other FK refs) throw `NotFoundException` (**404**), not 400. After Cloudinary upload, a failed DB create/update triggers CDN cleanup (soft-fail). `deletePhoto` soft-fails CDN delete then still removes the DB row. Event catalog images use `EVENT_CATALOG_GALLERY_CATEGORY_ID` or slug `event-catalog`.

### Floor layout deep QA

Pirámide tipada para publish gate / palette / upsert / chair-price sync (sin Stripe):

| Layer | Focus |
|-------|--------|
| **Unit service** | public publish fallback (upcoming configs), enrich chair prices, sync write + early exits, palette empty/`tablesBySize`, `isTablePlacedOnLayout` |
| **E2E contratos** | HTTP matrix with service mocks + typed bodies + auth gates + `x-request-id` |
| **E2E admin-flows** | Real `FloorLayoutService` + mocked repo via HTTP (GET palette, PUT upsert) |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `floor-layout.service.ts` statements | ~**81%** | **96.77%** | **≥85%** |
| `src/modules/floor-layout/**` statements | — | **88.65%** | **≥85%** |

Measure with `npm run test:cov:floor-layout` (excludes `*.module.ts`, `*.dto.ts`, `__mocks__`, `testing/`, specs). No global `coverageThreshold`.

**Notes:** Public `GET /floor-layout` also opens when any upcoming-event config has `clientEnabled` (global publish toggle optional). Chair `unitPrice` is enriched from DB on read and synced into active layout JSON after standalone-chair price edits.

### Header media deep QA

Pirámide tipada para hero photos / videos (ensure category, MIME gates, toggle/delete/focal):

| Layer | Focus |
|-------|--------|
| **Unit service** | ensureHeaderCategory create-on-miss, upload empty/MIME/video skip dimensions, toggle happy, delete/focal NotFound outside category |
| **E2E contratos** | HTTP matrix with service mocks + typed bodies + `x-request-id` on errors |
| **E2E admin-flows** | Real `HeaderMediaService` + mocked repo/gallery via HTTP |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `header-media.service.ts` statements | ~**81%** | **98.3%** | **≥85%** |
| `src/modules/header-media/**` statements | — | **96.84%** | **≥80%** |

Measure with `npm run test:cov:header-media` (excludes `*.module.ts`, `*.dto.ts`, `__mocks__`, `testing/`, specs). No global `coverageThreshold`.

**Notes:** Header photos live in a gallery category (`HEADER_MEDIA_GALLERY_SLUG` / fallback `home-header`). Admin mutations require the photo to belong to that category (`NotFoundException` **404** otherwise). Image uploads validate hero dimensions; video MIME skips that check. Uploads delegate to `GalleryService.createPhoto` / `deletePhoto`.

### Services deep QA

Pirámide tipada para catálogo público / admin CRUD / service-type guards (Cloudinary mocked):

| Layer | Focus |
|-------|--------|
| **Unit service** | updateService text/image/clearImage/disable/P2002, deleteServiceType success + linked conflicts, updateServiceType happy, getPublicServices/getAdminServiceById smoke |
| **E2E contratos** | HTTP matrix with service mocks + typed bodies (`GET /services`, `GET /services/admin/:id`) |
| **Integration gated** | `SERVICES_INTEGRATION=1` create/read against real DB |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `services.service.ts` statements | ~**40%** | **90.51%** | **≥80%** |
| `src/modules/services/**` statements | — | **79.78%** | **≥70%** |

Measure with `npm run test:cov:services` (excludes `*.module.ts`, `*.dto.ts`, `__mocks__`, `testing/`, specs). No global `coverageThreshold`.

**Notes:** Disable/delete guards throw `ConflictException` (**409**) when bookings or gallery photos are linked. `updateService` replaces Cloudinary media atomically (failed old-media delete rolls back the new upload). Service types are 1:1 with services (`P2002` on duplicate type assignment).

### Venue layout settings deep QA

Pirámide tipada para publish toggle / promo media / reservation window / event-date sync:

| Layer | Focus |
|-------|--------|
| **Unit service** | upsertAdminSettings update + event date sync, upsertAdminPromoMedia create/replace/upload-fail cleanup, deleteAdminPromoMedia, getAdminSettings, isClientEnabled |
| **E2E contratos** | HTTP matrix with service mocks on public + admin controllers |
| **Integration gated** | `VENUE_LAYOUT_SETTINGS_INTEGRATION=1` upsert/read against real DB |

| Scope | Baseline (antes) | Medido (después) | Target |
|-------|------------------|------------------|--------|
| `venue-layout-settings.service.ts` statements | ~**58%** | **100%** | **≥80%** |
| `src/modules/venue-layout-settings/**` statements | — | **89.87%** | **≥75%** |

Measure with `npm run test:cov:venue-layout-settings` (excludes `*.module.ts`, `*.dto.ts`, `__mocks__`, `testing/`, specs). No global `coverageThreshold`.

**Notes:** Changing `reservationEventDate` syncs paid seat reservations when an active venue-seating event exists. Promo upload failures delete the new Cloudinary asset; successful replace soft-deletes the previous public id. Sales window validation requires `reservationClosesAt` strictly after `reservationOpensAt`.

## Deployment

Deploy via your host (e.g. Render) with `npm run start:prod` after Prisma migrate. See Nest [deployment docs](https://docs.nestjs.com/deployment) for general NestJS guidance.

## License

UNLICENSED (private Shamell project).
