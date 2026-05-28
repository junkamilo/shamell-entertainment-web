# On Coming Events — routes and flows

## Public

| Route | Purpose |
|-------|---------|
| `/on-coming-events` | Hub: cards for all `UPCOMING_EVENTS` |
| `/on-coming-events/[slug]/classes` | Class schedule + Stripe embedded checkout |
| `/on-coming-events/[slug]/seats` | Floor plan seat reservations for that event |
| `/upcoming-events` | Redirects to `/on-coming-events` |

## API

- `GET /api/v1/events?publicSection=UPCOMING_EVENTS` — hub cards (includes `slug`, `experienceType`)
- `GET /api/v1/upcoming-events/:slug` — event detail
- `GET /api/v1/upcoming-events/:slug/sessions` — class sessions
- `POST /api/v1/upcoming-events/:slug/sessions/checkout-session` — class Stripe checkout
- `GET /api/v1/class-enrollments/session-status?session_id=` — class return page
- `GET /api/v1/venue-reservations/availability?upcomingEventSlug=` — seat availability per event
- `POST /api/v1/venue-reservations/checkout-session` — body may include `upcomingEventSlug`

## Stripe webhook order

1. `booking_quote`
2. `class_session`
3. `venue_seat` (venue reservations)

## Admin

- On Coming Events (site) → Upcoming: create event with **Experience** = Classes or Venue seating
- Edit a **Classes** event → manage **Class sessions** in the form
- Venue seating: `PATCH /api/v1/upcoming-events/admin/events/:id/venue-config` (sales window per event)
