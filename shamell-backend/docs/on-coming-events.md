# On Coming Events — routes and flows

## Concepts (recurring classes)

| Concept | Description |
|---------|-------------|
| **Weekday** | Active day on the reservation template (e.g. Wed, Thu). |
| **Section** | Time window on a weekday (`ReservationEventClassSection`: start/end, default capacity, optional price override). |
| **Session** | Concrete occurrence (`UpcomingClassSession`) generated from sections; sold via Stripe. |
| **Event base price** | Catalog `Event.price`; default per-section price when override is empty. |
| **Drop-in** | Public flow: calendar day → section(s) → one payment per session or same-day bundle. |
| **Same-day bundle** | Multiple sections on one calendar day; one Stripe payment = sum of session prices (`class_session_bundle`). |
| **Full month package** | All active sessions in a calendar month; one Stripe payment at admin-defined flat price (`class_month_package`). |

Sessions are generated automatically (12-week window, upsert) when an admin saves a `RECURRING_WEEKLY` template or venue config.

**Legacy:** multi-day `class_package` checkout (section template selections). Historical package enrollments still reconcile via webhook.

## Public

| Route | Purpose |
|-------|---------|
| `/on-coming-events` | Hub: cards for all `UPCOMING_EVENTS` |
| `/on-coming-events/[slug]` | Event detail; class booking wizard |
| `/on-coming-events/[slug]/classes` | Class schedule + Stripe embedded checkout |
| `/on-coming-events/[slug]/classes/return` | Single-session checkout return |
| `/on-coming-events/[slug]/classes/package-return` | Same-day bundle or month package return |
| `/on-coming-events/[slug]/return` | Fixed-event ticket checkout return |
| `/on-coming-events/return` | Venue seat checkout return (canonical; `event_slug` query param) |
| `/on-coming-events/[slug]/seats` | Floor plan seat reservations for that event |
| `/pay/quote` | Booking quote payment entry (`?token=`) |
| `/pay/quote/return` | Booking quote checkout return |
| `/upcoming-events` | Redirects to `/on-coming-events` |

Legacy venue return `/on-coming-events/[slug]/seats/return` redirects to `/on-coming-events/return?event_slug={slug}` (Next.js `redirects` in frontend `next.config.ts`).

## API

- `GET /api/v1/events?publicSection=UPCOMING_EVENTS` — hub cards (includes `slug`, `experienceType`)
- `GET /api/v1/upcoming-events/:slug` — detail; `schedule.days[]` for recurring, `sessions[]` with `weekday`/`sectionId`/prices, `monthPackage` when enabled
- `GET /api/v1/upcoming-events/:slug/class-options` — days, sections, sessions grouped by weekday
- `GET /api/v1/upcoming-events/:slug/sessions` — class sessions list
- `POST /api/v1/upcoming-events/:slug/sessions/checkout-session` — drop-in Stripe checkout (`flow: class_session`)
- `POST /api/v1/upcoming-events/:slug/sessions/bundle-checkout-session` — same-day multi-section checkout (`flow: class_session_bundle`)
- `POST /api/v1/upcoming-events/:slug/class-package/checkout-session` — full month package checkout (`flow: class_month_package`, body: `monthIso`, customer fields)
- `GET /api/v1/class-enrollments/session-status?session_id=` — return pages (reconciles paid Stripe if webhook delayed)
- `POST /api/v1/class-enrollments/reconcile?session_id=` — manual reconcile (throttled)
- `GET /api/v1/venue-reservations/availability?upcomingEventSlug=` — seat availability per event
- `POST /api/v1/venue-reservations/checkout-session` — body may include `upcomingEventSlug`; Stripe `return_url` → `/on-coming-events/return?session_id=…&event_slug=…`
- `GET /api/v1/venue-reservations/session-status?session_id=` — venue return page (reconciles paid Stripe if webhook delayed)
- `GET /api/v1/fixed-event-enrollments/session-status?session_id=` — fixed ticket return page
- `POST /api/v1/fixed-event-enrollments/reconcile?session_id=` — manual reconcile (throttled)
- `GET /api/v1/bookings/public/quote/session-status?session_id=` — booking quote return page (reconciles paid Stripe if webhook delayed)

## Pricing (admin)

1. Set **event base price** (required for recurring classes).
2. Optionally set **section price override** per block; empty = base price.
3. **SHARED SETUP (2+ days)** copies section templates; price overrides are optional in the blueprint.
4. Optionally enable **Full month package** on venue config: flat `classPackagePrice` and optional `classPackageLabel`.

## Stripe webhook order

1. `booking_quote`
2. `class_session`
3. `class_package` (legacy) / `class_session_bundle` / `class_month_package` (package enrollment row; one email per purchase)
4. `venue_seat` (venue reservations)

## Admin

- On Coming Events → create/edit with **RECURRING WEEKDAYS (CLASSES)**: weekdays, sections per day, event base price, optional full month package.
- Template API accepts `classSections[]`; overlap validation per weekday.
- Edit recurring class event → **Generated class sessions** panel lists upcoming occurrences.
- `PATCH /api/v1/upcoming-events/admin/events/:id/venue-config` — link template; `classPackage*` fields persist for recurring classes
- `POST /api/v1/upcoming-events/admin/events/:id/sessions/regenerate` — manual session regeneration
