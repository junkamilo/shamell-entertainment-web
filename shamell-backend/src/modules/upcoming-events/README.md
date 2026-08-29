# Upcoming Events — Fixed ticket modes

## Purchase modes (unchanged public API)

`resolveUpcomingPurchaseContext` still returns `purchaseMode: fixed_ticket` for FIXED EVENT templates without venue seating. Consumers that only check `purchasable` / `salesOpen` keep working.

## Fixed ticket sub-modes (`UpcomingVenueConfig.fixedTicketMode`)

| Mode | `clientEnabled` | Capacity | Price source |
|------|-----------------|----------|--------------|
| `SINGLE` | `false` | `fixedTicketCapacity` | `Event.price` |
| `PACKAGES` | `false` | per package | min active package → derived `Event.price` (hub “From $X”) |
| (seating) | `true` | layout 3D | N/A — not packages |

**Constraint:** `PACKAGES` XOR `clientEnabled=true` (DB check + service validation).

**Create flow:** Admin may set `fixedTicketMode = PACKAGES` before any packages exist (so the form can reopen and add packages). Public sales stay blocked until at least one **active** package with remaining inventory exists (`purchasable` / checkout / public UI).

## Data model

- **Activities** (`upcoming_event_activities`) — FK `events.id`; shared labels/descriptions.
- **Packages** (`upcoming_fixed_event_packages`) — FK `events.id`; price, capacity, arrival window.
- **Bridge** (`upcoming_event_package_activities`) — which activities each package includes.
- **Enrollments** — optional `packageId` + snapshot columns for historical accuracy.

## Checkout

Public/admin checkout sends optional `packageId` when `fixedTicketMode = PACKAGES`. Pending enrollments are created inside a transaction with row lock on the package to prevent oversell.

## Known limitation (future iteration)

Package capacity is **per tier**, not pooled per shared activity. If the real venue limit is “100 seats for the 8 PM show” across tiers, a second iteration needs **shared activity pools** — not implemented in this release.

## Staging E2E — fixed ticket packages

Run once on staging (or local with Stripe test mode) before promoting to production:

1. `prisma migrate deploy` (packages / activity media / `showText` migrations).
2. Admin: **New upcoming event** → Sell ticket packages → add activities → **Create event** → modal reopens → **Add package(s)** → Save (must not fail with `PACKAGES_EMPTY`).
3. Public: event detail → **Buy** on a package card → Embedded Checkout (test card) → return page shows ticket # + verification UUID.
4. Customer email: package title, includes, **same** verification UUID.
5. Ops email (`ADMIN_OPS_EMAIL`): buyer name/email + **same** UUID.
6. Admin Payment history: `FIXED_TICKET` row with package + verification code.
7. Box office: PACKAGES event → select package → cash and/or Stripe link → enrollment succeeds.
8. Webhook local: `stripe listen --forward-to localhost:3001/api/v1/stripe/webhook`.
