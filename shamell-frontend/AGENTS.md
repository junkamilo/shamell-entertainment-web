<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Shamell frontend — agent notes

## Admin architecture (mental model)

```text
src/
  app/admin/           → SOLO URLs (page/layout thin)
  features/admin/      → SOLO negocio (UI + hooks + API)
  components/admin/    → SOLO design system
  lib/admin/           → auth, API base, route constants
```

See `src/features/admin/ARCHITECTURE_SHIMS.md` for layer rules and the `upcoming-events` alias note.

## Admin feature module template

Domain lives under `src/features/admin/<feature>/`. App Router entry is a thin reexport under `src/app/admin/(dashboard)/<feature>/` only — do **not** recreate `src/app/shamell-admin/`.

```
features/admin/<feature>/
├── types/                # feature-specific types
├── lib/                  # pure helpers, route constants, display formatters
├── services/             # fetch/mutate; use getAdminApiBaseUrl()
├── hooks/                # use<Feature>Page composes list/form/catalog hooks
├── components/           # *Page, *PageContent, modals, cards
└── index.ts              # default export for the thin page

app/admin/(dashboard)/<feature>/
├── page.tsx              # thin: export { default } from "@/features/admin/<feature>"
└── layout.tsx            # metadata title optional
```

Canonical URLs are `/admin/…`. Legacy `/shamell-admin/…` is handled only by permanent redirects in `next.config.ts`.

### Auth and API base (required)

- **Token / headers:** `getAdminBearerToken()` and `getAdminAuthHeaders()` from `@/lib/admin/auth` (or re-exports under `@/app/admin/shared/lib/adminAuth`).
- **API origin:** `getAdminApiBaseUrl()` from `@/lib/admin/apiBaseUrl` (reads `NEXT_PUBLIC_BACKEND_URL`).
- Do **not** use `process.env.NEXT_PUBLIC_BACKEND_URL` in components or hooks; keep env access in `lib/` / `services/`.
- Legacy `*Auth.ts` files under features re-export `adminAuth` with feature-specific names — prefer `adminAuth` / `@/lib/admin/auth` for new code.

### Public contact (`src/app/contacto/`)

- Pure wizard/catalog logic: `lib/inquiry/` (`wizardTypes`, `wizardValidation`, `inquiryCodeUtils`, `inquiryDetailsBuilder`).
- State: `hooks/useContactInquiryWizard`, `useContactInquiryCatalog`, `useContactInquiryAvailability`, composed by `useContactInquiryForm`.
- UI phases: `components/contact-inquiry/ContactInquiryPhase*.tsx` + `ContactInquiryField.tsx`.
- Public API base: `getPublicApiBaseUrl()` in `contacto/lib/apiBaseUrl.ts`.

## Venue tables / seating (`venue-tables`)

- **Admin:** `src/features/admin/venue-tables/` — route `/admin/venue-tables` (thin page under `app/admin/(dashboard)/venue-tables`). Visual configurator (SVG chair ring + `motion`), sizes `LARGE` | `MEDIUM` | `SMALL`, combo `bundlePrice` only (table includes all chairs in the package). **Standalone chairs** block on the same page: `availableQuantity` + `unitPrice` for chairs placed on the floor layout (not tied to a table).
- **API:** `GET/POST/PATCH/DELETE /api/v1/venue-tables/admin`, `POST /api/v1/venue-tables/admin/bulk` (create mode: name prefix + quantity → `"Prefix 1"` … `"Prefix N"` in one transaction), public `GET /api/v1/venue-tables`. Standalone chairs: `GET/PUT /api/v1/standalone-chairs/admin`, public `GET /api/v1/standalone-chairs`.
- **DB:** `venue_table_configs` (Prisma `VenueTableConfig`), `venue_standalone_chair_configs` (Prisma `VenueStandaloneChairConfig`, singleton).
- **Floor link:** placed tables on the layout reference `venueTableConfigId`; `visualX`/`visualY` sync on layout save.

## On Coming Events (`on-coming-events`)

- **3D scene (R3F):** `src/components/venue-3d/` — `VenueScene3D`, primitive room (`VenueRoomPlaceholder`), modular stage (`venue-3d/stage/`: platform, marquee lights, stairs, palms, backdrop), `carpet/RedCarpetRunner`, `bench/VenueDancerBench`, `CatalogTableMesh` / `StandaloneChairMesh`, `layoutCoords3d`. Phase 2: GLB under `public/venue-3d/` (see `venue-3d/assets/README.md`).
- **Admin editor (Seating layout):** `src/features/admin/on-coming-events/` — route `/admin/on-coming-events/layout`. `next/dynamic` (`ssr: false`). Palette drag via `@dnd-kit/core` + floor raycast (`floorLayoutRaycast.ts`); placed-item drag via `useItemPointerDrag3d` inside the Canvas.
- **Palette inventory:** `GET /api/v1/floor-layout/admin/palette` — counts from Table seating (`tablesBySize`: Large/Medium/Small × unplaced) and standalone chairs (`availableQuantity` minus placed). Drag assigns next free catalog table of that size.
- **Placed item kinds:** `catalog_table` (requires `venueTableConfigId`, `tableName`, `size`, `includedChairs`) | `standalone_chair`. Legacy kinds show a clear-items banner; save rejects old kinds.
- **Layout types (shared):** `src/components/floor-layout/layoutTypes.ts`. Legacy SVG helpers (`FloorLayoutViewer`, `renderPlacedItem`, croquis PNG) remain in repo but are not used in the active admin/public flow.
- **Public interactive:** `src/app/on-coming-events/` — route `/on-coming-events`, `VenueScene3D` in `mode="public-select"` (click table/chair → modal → Stripe **Embedded Checkout** in-modal). **Stripe return URLs (canonical):**
  - Venue seats → `/on-coming-events/return?session_id=…&event_slug={slug}` (legacy `/on-coming-events/{slug}/seats/return` redirects here via `next.config.ts`)
  - Class session → `/on-coming-events/{slug}/classes/return?session_id=…`
  - Class bundle / month package → `/on-coming-events/{slug}/classes/package-return?session_id=…`
  - Fixed ticket → `/on-coming-events/{slug}/return?session_id=…`
  - Booking quote → `/pay/quote/return?session_id=…`
  All return pages poll session status and show `ClassPaymentConfirmationPanel` (or equivalent) with Home — never a global 404. Smoke: `npm run smoke:returns` (server must be running). Layout: `GET /api/v1/floor-layout`. Reservations: `POST /api/v1/venue-reservations/checkout-session`, `GET …/availability`, `GET …/session-status`. Prices from server (`bundlePrice` / `unitPrice`).
- **Client publish + home promo:** `src/features/admin/on-coming-events/` — route `/admin/on-coming-events`. Toggle `clientEnabled`, promo, **reservation event date/label** (`reservationEventDate`, `reservationEventLabel`). When `clientEnabled`, home promo + header **ON COMING EVENTS**. Settings API: `GET/PATCH /api/v1/on-coming-events/settings` (legacy alias `/api/v1/venue-layout/…`).
- **Seat reservations admin:** `src/features/admin/venue-reservations/` — route `/admin/venue-reservations`. List/cancel `GET/PATCH /api/v1/venue-reservations/admin`.
- **Alias `/admin/upcoming-events`:** thin redirect to `/admin/on-coming-events` — do not create `features/admin/upcoming-events`.
- **Stripe env (backend + frontend):** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Webhook: `POST /api/v1/stripe/webhook` (raw body; `nest` bootstrap uses `rawBody: true`). Local test: `stripe listen --forward-to localhost:3001/api/v1/stripe/webhook`.
- **API (admin layout):** `GET/PUT /api/v1/floor-layout/admin`, `GET /api/v1/floor-layout/admin/palette`.
- **DB:** `venue_layout_client_settings` (publish + promo + reservation event fields), `venue_seat_reservations` (Stripe checkout / `PAID` via webhook).

## Verification

After structural changes: `npm run build`, `npm run start`, then `npm run smoke:returns` (or manual smoke on the affected route).
