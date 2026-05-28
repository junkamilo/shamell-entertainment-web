<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Shamell frontend — agent notes

## Admin feature module template

New screens under `src/app/shamell-admin/<feature>/` (or `src/app/admin/` for cross-cutting admin UI) should follow:

```
<feature>/
├── page.tsx              # thin: default export from components/*Page
├── layout.tsx            # metadata title optional
├── types/                # feature-specific types
├── lib/                  # pure helpers, route constants, display formatters
├── services/             # fetch/mutate; use getAdminApiBaseUrl()
├── hooks/                # use<Feature>Page composes list/form/catalog hooks
└── components/           # *Page, *PageContent, modals, cards
```

### Auth and API base (required)

- **Token / headers:** `getAdminBearerToken()` and `getAdminAuthHeaders()` from `@/app/admin/shared/lib/adminAuth`.
- **API origin:** `getAdminApiBaseUrl()` from `@/app/admin/shared/lib/adminApiBaseUrl` (reads `NEXT_PUBLIC_BACKEND_URL`).
- Do **not** use `process.env.NEXT_PUBLIC_BACKEND_URL` in components or hooks; keep env access in `lib/` / `services/`.
- Legacy `*Auth.ts` files under features re-export `adminAuth` with feature-specific names — prefer `adminAuth` for new code.

### Public contact (`src/app/contacto/`)

- Pure wizard/catalog logic: `lib/inquiry/` (`wizardTypes`, `wizardValidation`, `inquiryCodeUtils`, `inquiryDetailsBuilder`).
- State: `hooks/useContactInquiryWizard`, `useContactInquiryCatalog`, `useContactInquiryAvailability`, composed by `useContactInquiryForm`.
- UI phases: `components/contact-inquiry/ContactInquiryPhase*.tsx` + `ContactInquiryField.tsx`.
- Public API base: `getPublicApiBaseUrl()` in `contacto/lib/apiBaseUrl.ts`.

## Venue tables / seating (`venue-tables`)

- **Admin:** `src/app/shamell-admin/venue-tables/` — route `/shamell-admin/venue-tables`. Visual configurator (SVG chair ring + `motion`), sizes `LARGE` | `MEDIUM` | `SMALL`, combo `bundlePrice` only (table includes all chairs in the package). **Standalone chairs** block on the same page: `availableQuantity` + `unitPrice` for chairs placed on the floor layout (not tied to a table).
- **API:** `GET/POST/PATCH/DELETE /api/v1/venue-tables/admin`, `POST /api/v1/venue-tables/admin/bulk` (create mode: name prefix + quantity → `"Prefix 1"` … `"Prefix N"` in one transaction), public `GET /api/v1/venue-tables`. Standalone chairs: `GET/PUT /api/v1/standalone-chairs/admin`, public `GET /api/v1/standalone-chairs`.
- **DB:** `venue_table_configs` (Prisma `VenueTableConfig`), `venue_standalone_chair_configs` (Prisma `VenueStandaloneChairConfig`, singleton).
- **Floor link:** placed tables on the layout reference `venueTableConfigId`; `visualX`/`visualY` sync on layout save.

## On Coming Events (`on-coming-events`)

- **3D scene (R3F):** `src/components/venue-3d/` — `VenueScene3D`, primitive room (`VenueRoomPlaceholder`), modular stage (`venue-3d/stage/`: platform, marquee lights, stairs, palms, backdrop), `carpet/RedCarpetRunner`, `bench/VenueDancerBench`, `CatalogTableMesh` / `StandaloneChairMesh`, `layoutCoords3d`. Phase 2: GLB under `public/venue-3d/` (see `venue-3d/assets/README.md`).
- **Admin editor (Seating layout):** `src/app/shamell-admin/on-coming-events/layout/` — route `/shamell-admin/on-coming-events/layout`. `next/dynamic` (`ssr: false`). Palette drag via `@dnd-kit/core` + floor raycast (`floorLayoutRaycast.ts`); placed-item drag via `useItemPointerDrag3d` inside the Canvas.
- **Palette inventory:** `GET /api/v1/floor-layout/admin/palette` — counts from Table seating (`tablesBySize`: Large/Medium/Small × unplaced) and standalone chairs (`availableQuantity` minus placed). Drag assigns next free catalog table of that size.
- **Placed item kinds:** `catalog_table` (requires `venueTableConfigId`, `tableName`, `size`, `includedChairs`) | `standalone_chair`. Legacy kinds show a clear-items banner; save rejects old kinds.
- **Layout types (shared):** `src/components/floor-layout/layoutTypes.ts`. Legacy SVG helpers (`FloorLayoutViewer`, `renderPlacedItem`, croquis PNG) remain in repo but are not used in the active admin/public flow.
- **Public interactive:** `src/app/on-coming-events/` — route `/on-coming-events`, `VenueScene3D` in `mode="public-select"` (click table/chair → modal → Stripe **Embedded Checkout** in-modal). Return URL: `/on-coming-events/return?session_id=…`. Layout: `GET /api/v1/floor-layout`. Reservations: `POST /api/v1/venue-reservations/checkout-session`, `GET …/availability`, `GET …/session-status`. Prices from server (`bundlePrice` / `unitPrice`).
- **Client publish + home promo:** `src/app/shamell-admin/on-coming-events/` — toggle `clientEnabled`, promo, **reservation event date/label** (`reservationEventDate`, `reservationEventLabel`). When `clientEnabled`, home promo + header **ON COMING EVENTS**. Settings API: `GET/PATCH /api/v1/on-coming-events/settings` (legacy alias `/api/v1/venue-layout/…`).
- **Seat reservations admin:** `src/app/shamell-admin/venue-reservations/` — list/cancel `GET/PATCH /api/v1/venue-reservations/admin`.
- **Stripe env (backend + frontend):** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Webhook: `POST /api/v1/stripe/webhook` (raw body; `nest` bootstrap uses `rawBody: true`). Local test: `stripe listen --forward-to localhost:3001/api/v1/stripe/webhook`.
- **API (admin layout):** `GET/PUT /api/v1/floor-layout/admin`, `GET /api/v1/floor-layout/admin/palette`.
- **DB:** `venue_layout_client_settings` (publish + promo + reservation event fields), `venue_seat_reservations` (Stripe checkout / `PAID` via webhook).

## Verification

After structural changes: `npm run build` and a short manual smoke on the affected route.
