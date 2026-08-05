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

See `src/features/admin/ARCHITECTURE_SHIMS.md` for layer rules, the `upcoming-events` alias note, the **data-display** DS contract (`Table` empty → null + `EmptyState`, variants, `tableIconBtnClass*`), the **inputs** DS contract (MultiSelect min-1, ActiveToggle blocked, DateField native date), the **layout** DS contract (`ModuleHero` / `BackButton`), the **media** DS contract (pick / upload / preview), and the **overlays** DS contract (`Modal` / `ConfirmDeleteModal` / `BlockedActionModal` / `MODAL_LAYERS`).

## Public marketing experiences

Removed. Types of Events on the home page use **Inquire** → `/contacto` only (no `/experiences/[slug]` marketing pages).

Live home **SERVICE CATALOG** UI: see **Public service catalog UI** below (folder name `experiences` is a legacy alias).

## Public catalog UI (`components/catalog`)

Public event-type catalog UI (not admin DS). Import from `@/components/catalog`.

- **EventCatalogCard** — home TYPES OF EVENTS (`ServicesSection`); prop `item: EventCatalogItem`.
- **EventCatalogCardHero** — portrait hero reused by hub cards (`OnComingEventHubCard`).
- **EventCatalogCardExpandSections** — DESCRIPTION + EVENT TYPES panels (events only).
- **CatalogExpandRow** — branded Expand/Collapse control; `ExperienceCard` reuses this row but still owns its own panels.

Deps: `@/components/media` (`CardMedia`), `catalog-slide-context`, `formatCatalogPriceAmount`, contact href helpers (`buildEventLineContactHref`).

Co-located Vitest: `npx vitest run src/components/catalog`.

## Public service catalog UI (`components/experiences`)

Home SERVICE CATALOG (`ExperiencesSection` + `ExperienceCard`). Folder name `experiences` is a legacy alias for the **services** API — not marketing `/experiences/[slug]` (removed).

- Type `Experience` + `experiencesFallbackData`: `lib/services/experiencesData`.
- Fetch/normalize: `hooks/use-experiences`.
- Import: `@/components/experiences` (named `ExperienceCard`).
- Reuses `CatalogExpandRow` only; does **not** use `EventCatalogCard*`.

Co-located Vitest: `npx vitest run src/components/experiences`.

## Public card media (`components/media`)

`CardMedia` for catalog + experiences carousel heroes (IMAGE lazy `<img>`; VIDEO poster + gated `<video>` on in-view + hover/`isActive`).

- Distinct from **`components/admin/media`** (pick / upload / preview).
- Native `<img>` / `<video>` for CDN URLs; brand crop `object-[center_28%]`.
- Import: `@/components/media`.

Co-located Vitest: `npx vitest run src/components/media`.

## Public shared UI (`components/shared`)

Kitchen of cross-cutting **public** UI. Import from `@/components/shared` (named exports; root barrel).

| Cluster | Contents |
|---------|----------|
| `status/` | `AppStatusScreen`, `publicErrorMessage` (error / not-found boundaries) |
| `motion/` | `RevealOnView`, `RevealFromDepth`, `RevealStaggerGrid` |
| `background/` | `AnimatedBackground`, `PublicBackgroundGate` |
| `catalog-carousel/` | `CatalogCardCarousel`, slide context, layout helpers |
| `shamell/` | Countdown (+ helpers), Busy overlay, Alert dialog, Back button |
| `tickets/` | `FixedTicketInventoryDisplay` (hub / detail / venue reuse) |
| `site/` | `WhatsAppFloatingButton` |

**Boundaries:** admin `BackButton` ≠ `ShamellBackButton`; admin overlays ≠ `ShamellAlertDialog` / `ShamellBusyOverlay` (Busy is shared intentionally for public + some admin forms). Do not absorb admin DS here.

Co-located Vitest: `npx vitest run src/components/shared`.

## Public Stripe checkout UI (`components/stripe`)

Shell for Stripe **Embedded Checkout** (`StripeCheckoutHost` with `layout="page"` | `"overlay"`). Import from `@/components/stripe`.

- **Host** — page host or body portal dialog; composes `StripeEmbeddedCheckout` + `useStripeOverlayBodyLock`.
- **Boundaries:** keys / branding / payment-flow routes / return polling stay in `lib/stripe`. Admin agenda `stripe-webhooks` is unrelated. CSS shell remains `styles/stripe-checkout.css` (global; `body:has` hide chrome).
- Do **not** absorb this into `components/shared`.

Co-located Vitest: `npx vitest run src/components/stripe`.

## Admin feature module template

Domain lives under `src/features/admin/<feature>/`. App Router entry is a thin reexport under `src/app/admin/(dashboard)/<feature>/` only — do **not** recreate `src/app/shamell-admin/`.

```
features/admin/<feature>/
├── types/                # feature-specific types
├── lib/                  # pure helpers (+ co-located *.spec.ts)
├── services/             # fetch/mutate; use getAdminApiBaseUrl() (+ *.spec.ts)
├── hooks/                # use<Feature>Page (+ selective *.spec.ts)
├── components/           # *Page, modals (+ selective *.spec.tsx)
├── test/                 # fixtures / MSW handlers / RTL utils / optional integration
└── index.ts              # default export for the thin page

app/admin/(dashboard)/<feature>/
├── page.tsx              # thin: export { default } from "@/features/admin/<feature>"
└── layout.tsx            # metadata title optional
```

Canonical URLs are `/admin/…`. Legacy `/shamell-admin/…` is handled only by permanent redirects in `next.config.ts`.

Sign-in: canonical `/admin/login` is a thin page → `@/features/admin/auth`. Legacy `/login` redirects permanently to `/admin/login` in `next.config.ts` only (no `app/login` route).

### Unit / Vitest convention

- **Co-locate** specs next to the code: `foo.ts` → `foo.spec.ts` (or `.spec.tsx` for UI). Vitest `include` is `src/**/*.{spec.ts,spec.tsx}` — do **not** use `.test.ts` (invisible to the runner).
- Feature `test/` is **infra only** (fixtures, MSW handlers, render helpers, optional `test/integration/`). Do not dump primary unit suites under `test/unit/`.
- Global MSW/RTL setup: `src/test/setup.ts` + `src/test/server.ts`. `*.spec.tsx` runs in jsdom via `environmentMatchGlobs`.
- Example suite: `src/features/admin/about` — `npx vitest run src/features/admin/about` (prefer local `node_modules/.bin/vitest`).

### Auth and API base (required)

- **Token / headers:** `getAdminBearerToken()` and `getAdminAuthHeaders()` from `@/lib/admin/auth`.
- **API origin:** `getAdminApiBaseUrl()` from `@/lib/admin/apiBaseUrl` (reads `NEXT_PUBLIC_BACKEND_URL`).
- **Routes:** path constants from `@/lib/admin/routes`.
- **Pricing helpers:** `@/lib/admin/pricing`.
- Do **not** use `process.env.NEXT_PUBLIC_BACKEND_URL` in components or hooks; keep env access in `lib/` / `services/`.
- Legacy feature `*Auth.ts` re-exports may wrap `@/lib/admin/auth` with feature-specific names — prefer `@/lib/admin/auth` for new code.
- `@/app/admin/shared/lib/*` are **compat-only** re-exports of the modules above; do not use in new code.

### Public contact (`src/app/contacto/` + `src/features/contacto/`)

Same layering as admin, for the public inquiry hub:

```text
app/contacto/           → SOLO page.tsx + layout.tsx (thin)
features/contacto/      → SOLO negocio (UI + hooks + services + types + lib/inquiry)
lib/publicApiBaseUrl.ts → getPublicApiBaseUrl()
lib/contacto/contactInquiryConstants.ts → CONTACTO_PATH + deep-link helpers (shared)
```

- Thin route: `export { default } from "@/features/contacto"`.
- Canonical path: `CONTACTO_PATH` from `@/lib/contacto/contactInquiryConstants` (marketing shell + deep-links; feature re-exports via `lib/contactoRoutes`).
- Pure wizard/catalog logic: `features/contacto/lib/inquiry/`.
- State: `useContactInquiryWizard`, `useContactInquiryCatalog`, `useContactInquiryAvailability`, composed by `useContactInquiryForm`.
- UI phases: `features/contacto/components/contact-inquiry/ContactInquiryPhase*.tsx`.
- Date/time pickers live in the feature; admin agenda/on-coming import `@/features/contacto/components/...`.

### Public gallery (`src/app/gallery/` + `src/features/gallery/`)

Same layering for the public gallery page and home preview hooks:

```text
app/gallery/            → SOLO page.tsx + layout.tsx (thin)
features/gallery/       → UI + hooks + services + types + lib
lib/publicApiBaseUrl.ts → getPublicApiBaseUrl()
lib/gallery/            → galleryRoutes (GALLERY_PATH, buildGalleryFilterHref), galleryData, galleryConstants
```

- Thin route: `export { default } from "@/features/gallery"`.
- Public path: `GALLERY_PATH` / `buildGalleryFilterHref` in `@/lib/gallery/galleryRoutes` (feature re-exports; `SiteHeader` / `GallerySection` import from lib).
- Home preview (`components/GallerySection`) imports hooks/types from `@/features/gallery`.
- Admin gallery remains separate: `features/admin/gallery` (`/admin/gallery`).

### Public forgot-password (`src/app/forgot-password/` + `src/features/forgot-password/`)

```text
app/forgot-password/           → SOLO page/layout (+ reset/) thin
features/forgot-password/      → UI + hooks + actions + services + types + lib
lib/publicApiBaseUrl.ts        → getPublicApiBaseUrl()
```

- Thin routes: `export { default } from "@/features/forgot-password"` and reset via `ResetPasswordPage`.
- Route constants (`FORGOT_PASSWORD_PATH`, etc.) live in the feature; `AdminLoginForm` imports from `@/features/forgot-password`.

### Agenda — private class (Book Class + Inbox)

- **Form:** `/admin/agenda/agendar?mode=class` → tab **BOOK PRIVATE CLASS** beside **BOOK**. UI: `features/admin/agenda/book-class/PrivateClassForm` (no GROUP / BOOK CLASS sub-tabs).
- **API:** `POST /api/v1/bookings/admin/private-class/cash` and `…/checkout-session`. Persists `bookings` with `bookingDetails.kind = "private_class"`. Stripe uses existing quote payment emails; cash sends private-class confirmation.
- **Catalog:** seed ServiceType “Private Class” (`PRIVATE_CLASS`) or set `PRIVATE_CLASS_SERVICE_ID`.
- **Inbox:** third lane `private_classes` on `/admin/agenda/peticiones` (`PeticionesLaneTabs`). Excluded from BOOKINGS & REQUESTS feed.

## Venue tables / seating (`venue-tables`)

- **Admin:** `src/features/admin/venue-tables/` — route `/admin/venue-tables` (thin page under `app/admin/(dashboard)/venue-tables`). Visual configurator (SVG chair ring + `motion`), sizes `LARGE` | `MEDIUM` | `SMALL`, combo `bundlePrice` only (table includes all chairs in the package). **Standalone chairs** block on the same page: `availableQuantity` + `unitPrice` for chairs placed on the floor layout (not tied to a table).
- **API:** `GET/POST/PATCH/DELETE /api/v1/venue-tables/admin`, `POST /api/v1/venue-tables/admin/bulk` (create mode: name prefix + quantity → `"Prefix 1"` … `"Prefix N"` in one transaction), public `GET /api/v1/venue-tables`. Standalone chairs: `GET/PUT /api/v1/standalone-chairs/admin`, public `GET /api/v1/standalone-chairs`.
- **DB:** `venue_table_configs` (Prisma `VenueTableConfig`), `venue_standalone_chair_configs` (Prisma `VenueStandaloneChairConfig`, singleton).
- **Floor link:** placed tables on the layout reference `venueTableConfigId`; `visualX`/`visualY` sync on layout save.

## On Coming Events (`on-coming-events`)

- **3D scene (R3F):** see **Venue 3D (`components/venue-3d`)**. Phase 2 GLB notes: `venue-3d/assets/README.md`.
- **Admin editor (Seating layout):** `src/features/admin/on-coming-events/` — route `/admin/on-coming-events/layout`. `next/dynamic` (`ssr: false`). Palette drag via `@dnd-kit/core` + floor raycast (`floorLayoutRaycast.ts`); placed-item drag via `useItemPointerDrag3d` inside the Canvas.
- **Palette inventory:** `GET /api/v1/floor-layout/admin/palette` — counts from Table seating (`tablesBySize`: Large/Medium/Small × unplaced) and standalone chairs (`availableQuantity` minus placed). Drag assigns next free catalog table of that size.
- **Placed item kinds:** `catalog_table` (requires `venueTableConfigId`, `tableName`, `size`, `includedChairs`) | `standalone_chair`. Legacy kinds show a clear-items banner; save rejects old kinds.
- **Layout types (shared):** `@/components/floor-layout` — canonical types + 2D `shapeConfig` for admin palette. Active UI is R3F (`venue-3d` + admin layout editor). Optional static asset `public/floor-layout/croquis-v1.svg` is not the active viewer.
- **Public interactive:** `src/app/on-coming-events/` — thin pages/layouts only; business UI + Stripe return clients live in `src/features/on-coming-events/` (do **not** put fetch/polling in `app/`). Route `/on-coming-events`, `VenueScene3D` in `mode="public-select"` (click table/chair → modal → Stripe **Embedded Checkout** in-modal). Canon paths: `ON_COMING_EVENTS_PUBLIC_PATH` + href builders in `@/lib/on-coming-events/upcomingEventPublicRoutes` (hub/detail/classes/seats + return URLs). **Stripe return URLs (canonical):**
  - Venue seats → `/on-coming-events/return?session_id=…&event_slug={slug}` (legacy `/on-coming-events/{slug}/seats/return` redirects here via `next.config.ts` only — no `seats/return` page)
  - Class session → `/on-coming-events/{slug}/classes/return?session_id=…`
  - Class bundle / month package → `/on-coming-events/{slug}/classes/package-return?session_id=…`
  - Fixed ticket → `/on-coming-events/{slug}/return?session_id=…`
  - Booking quote → `/pay/quote/return?session_id=…`
  All return pages poll session status and show `ClassPaymentConfirmationPanel` (or equivalent) with Home — never a global 404. Smoke: `npm run smoke:returns` (Stripe returns) and `npm run smoke:on-coming-events` (hub/detail/seats/classes + legacy redirects). Layout: `GET /api/v1/floor-layout`. Reservations: `POST /api/v1/venue-reservations/checkout-session`, `GET …/availability`, `GET …/session-status`. Prices from server (`bundlePrice` / `unitPrice`).
- **Client publish + home promo:** `src/features/admin/on-coming-events/` — route `/admin/on-coming-events`. Toggle `clientEnabled`, promo, **reservation event date/label** (`reservationEventDate`, `reservationEventLabel`). When `clientEnabled`, home promo + header **ON COMING EVENTS**. Settings API: `GET/PATCH /api/v1/on-coming-events/settings` (legacy alias `/api/v1/venue-layout/…`).
- **Seat reservations admin:** `src/features/admin/venue-reservations/` — route `/admin/venue-reservations`. List/cancel `GET/PATCH /api/v1/venue-reservations/admin`.
- **Alias `/admin/upcoming-events`:** permanent redirect in `next.config.ts` to `/admin/on-coming-events` — do not create `features/admin/upcoming-events`.
- **Alias `/upcoming-events` (public):** permanent redirect in `next.config.ts` to `/on-coming-events` (no `app/upcoming-events` page). Legacy `/venue-layout` likewise redirects to `/on-coming-events`. Legacy `/registro` redirects permanently to `/` in `next.config.ts` only (no `app/registro` route).
- **Stripe env (backend + frontend):** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Webhook: `POST /api/v1/stripe/webhook` (raw body; `nest` bootstrap uses `rawBody: true`). Local test: `stripe listen --forward-to localhost:3001/api/v1/stripe/webhook`.
- **API (admin layout):** `GET/PUT /api/v1/floor-layout/admin`, `GET /api/v1/floor-layout/admin/palette`.
- **DB:** `venue_layout_client_settings` (publish + promo + reservation event fields), `venue_seat_reservations` (Stripe checkout / `PAID` via webhook).

## Shared floor layout contract (`components/floor-layout`)

Shared layout contract (not admin DS, not public page UI). Import from `@/components/floor-layout`.

- **Types / constants:** `PlacedLayoutItem`, `VenueFloorLayout`, `FloorLayoutPalette`, `FloorSceneZones`, `TABLE_SIZE_LABELS`, viewBox defaults, `isCatalogTableItem` / `isStandaloneChairItem`.
- **`shapeConfig`:** 2D admin palette / drag-ghost visuals only (`tableVisualForSize`, `STANDALONE_CHAIR_VISUAL`) — not the R3F scene.
- Consumers: admin layout editor, public seats, `venue-3d`, venue-reservations, box-office.

Co-located Vitest: `npx vitest run src/components/floor-layout`.

## Venue 3D (`components/venue-3d`)

R3F render kitchen for the venue floor (admin editor + public seat select). Import from `@/components/venue-3d`.

### Layout / types

- **Persisted layout types** stay in `@/components/floor-layout` (`PlacedLayoutItem`, `FloorLayoutPalette`, `FloorSceneZones`) — do not duplicate.
- **Venue-local props** live next to components and in cluster/root `types.ts` (`VenueScene3DProps`, `PlacedItemsLayerProps`, `VenueSceneLegendProps`, mesh props). Dual export: `export default` + `export { Name }` per UI folder.

### Tree

```text
venue-3d/
├── index.ts, types.ts
├── layoutCoords3d.ts, venueSceneConstants.ts, venueScenePerformance.ts, …
├── scene/          # VenueScene3D, FloorPickPlane, contexts
├── items/          # PlacedItemsLayer, CatalogTableMesh, bubbles, lib/
├── room/           # VenueRoomPlaceholder, VenueWoodFloor, VenueSceneLegend, lib/
├── stage/          # VenueStage + Stage* folders, stageConstants, lib/
├── chair/
│   ├── VenueBanquetChairMesh/ (+ smoke)
│   ├── InstancedBanquetChairs/ (+ smoke)
│   └── lib/   # chairConstants, silhouette, placements, builder, geometries, resolveChairMaterialState (+ pure specs)

├── carpet/RedCarpetRunner/   # smoke: RedCarpetRunner.spec.tsx
└── bench/VenueDancerBench/   # organized; not mounted in room
```

- Modular stage composition: platform, stairs, backdrop/signage, perimeter + zone lights, palms via **`StageCornerPlants`** inside `VenueStage`.
- **`VenueDancerBench`**: folderized optional décor — **not wired** into `VenueRoomPlaceholder` / `VenueStage` (avoid unrequested room visual change). Smoke: `bench/VenueDancerBench/VenueDancerBench.spec.tsx`.

### Boundaries & frozen contracts

- **`floor-layout`** = persisted layout types/data; **`venue-3d`** = 3D render only; admin drag/raycast stay in `features/admin/on-coming-events/layout`.
- **Frozen (prod seats already sold):** do not tune without fixtures + product approval — `WORLD_WIDTH`/`WORLD_DEPTH`, `layoutToWorld`/`worldToLayout`, `TABLE_WORLD` + `buildTableChairPlacements`, layout kinds + `item.id` ↔ `reservedIds`.
- `VenueScene3D` named export for `next/dynamic` (`.then(m => ({ default: m.VenueScene3D }))`).

### QA tiers (no real WebGL)

1. **Pure** — helpers/constants (Vitest node): coords, zones, chair placements/builder, materials, plank/palm/legend helpers, camera/perf.
2. **Presentational** — RTL + mocks of `@react-three/fiber` / `@react-three/drei` (`Html` → `div`).
3. **Host smoke** — `VenueScene3D` / `PlacedItemsLayer` with Canvas/children stubs.

```bash
npx vitest run src/components/venue-3d
npx eslint src/components/venue-3d
```

Manual smoke: public seats with reserved items (grey / no checkout).

## Public pay links (`src/app/pay/` + `src/features/pay/`)

Token checkout emails land on `/pay/{quote|class|venue-seat}?token=…` (Stripe Embedded Checkout full page). Returns:

- Quote → `/pay/quote/return?session_id=…`
- Class → `/pay/class/return?session_id=…` (reuses `ClassSessionReturnClient` from on-coming-events)
- Venue seat → `/pay/venue-seat/return?session_id=…` (reuses `VenueSeatReturnClient`)

```text
app/pay/           → SOLO page/layout thin (token gate + re-exports)
features/pay/      → PayTokenCheckoutClient wrappers, PayQuoteReturnClient, services
lib/pay/payRoutes  → PAY_* paths + buildPay*Href(token)
```

- Thin pages import from `@/features/pay` (class/venue returns from `@/features/on-coming-events`).
- Services use `getPublicApiBaseUrl()`.
- Smoke: `npm run smoke:pay` (entries) and `npm run smoke:returns` (includes `/pay/class/return`).

## Root App Router boundaries

`error.tsx`, `global-error.tsx`, and `not-found.tsx` must live under `src/app/` (Next.js convention). Shared UI: `AppStatusScreen` + `publicErrorMessage` via `@/components/shared` (`shared/status`). `global-error` repeats font CSS variables from `@/lib/theme/shamellFonts` because it replaces the root layout.

## Verification

After structural changes: `npm run build`, `npm run start`, then `npm run smoke:home`, `npm run smoke:returns`, `npm run smoke:pay`, `npm run smoke:on-coming-events`, `npm run smoke:admin-routes` (includes legacy `/login` → `/admin/login` and canonical `/admin/login`), `npm run smoke:contacto`, `npm run smoke:forgot-password`, and/or `npm run smoke:gallery` (or manual smoke on the affected route).
