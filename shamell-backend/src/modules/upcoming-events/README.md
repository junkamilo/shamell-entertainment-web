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

**Create flow:** Admin creates upcoming FIXED + packages in one submit: draft activities and packages in the form, then **Create event** persists event → schedule → activities → packages. Edit mode keeps immediate package CRUD (rename, deactivate, delete). Public sales stay blocked until at least one **active** package with remaining inventory exists (`purchasable` / checkout / public UI).

**Create defaults:** `POST /events/admin` for `UPCOMING_EVENTS` inserts the event and a venue config draft (`PACKAGES` + `fixedTicketCapacity = null`) in one transaction. That satisfies `chk_capacity_by_mode`. Schedule sync / venue-config PATCH then sets SINGLE capacity, PACKAGES, or seating as needed.

### Heal orphan upcoming events (ops)

If a deploy ran before the atomic create fix, some events may exist without `upcoming_venue_configs`. That leaves admin create retries stuck on **409** for the same name.

```sql
-- Find orphans
SELECT e.id, et.name, e.slug, e."createdAt"
FROM events e
JOIN event_types et ON et.id = e."eventTypeId"
LEFT JOIN upcoming_venue_configs vc ON vc."eventId" = e.id
WHERE e."publicSection" = 'UPCOMING_EVENTS'
  AND vc.id IS NULL;

-- Heal (keep events)
INSERT INTO upcoming_venue_configs (
  id, "eventId", "clientEnabled", "fixedTicketMode", "fixedTicketCapacity",
  "reservationTimezone", "classPackageEnabled", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, e.id, false, 'PACKAGES', NULL,
       'America/New_York', false, NOW(), NOW()
FROM events e
LEFT JOIN upcoming_venue_configs vc ON vc."eventId" = e.id
WHERE e."publicSection" = 'UPCOMING_EVENTS'
  AND vc.id IS NULL;

-- Or delete bad test events, then unused types:
-- DELETE FROM events WHERE id IN (/* orphan ids */);
-- DELETE FROM event_types et
-- WHERE et."catalogChannel" = 'UPCOMING_HUB'
--   AND NOT EXISTS (SELECT 1 FROM events e WHERE e."eventTypeId" = et.id);
```

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
2. Admin: **New upcoming event** → Sell ticket packages → add activities → add package(s) → **Create event** (one submit; must not reopen for packages; must not fail with `PACKAGES_EMPTY`).
3. Public: event detail → **Buy** on a package card → Embedded Checkout (test card) → return page shows ticket # + verification UUID.
4. Customer email: package title, includes, **same** verification UUID.
5. Ops email (`ADMIN_OPS_EMAIL`): buyer name/email + **same** UUID.
6. Admin Payment history: `FIXED_TICKET` row with package + verification code.
7. Box office: PACKAGES event → select package → cash and/or Stripe link → enrollment succeeds.
8. Webhook local: `stripe listen --forward-to localhost:3001/api/v1/stripe/webhook`.
