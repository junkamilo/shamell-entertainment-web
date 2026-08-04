# Admin architecture

Mental model (one story):

```text
src/
  app/admin/           → SOLO URLs (page/layout thin)
  features/admin/      → SOLO negocio (UI + hooks + API)
  components/admin/    → SOLO design system
  lib/admin/           → auth, API base, route constants, permissions
```

There is **no** `src/app/shamell-admin/` tree. Legacy bookmarks `/shamell-admin/*` redirect permanently to `/admin/*` via `next.config.ts`.

## Layers

- **DS:** `src/components/admin/{overlays,data-display,inputs,media,layout,icons}` — named exports, no domain
- **Features:** `src/features/admin/*` — domain UI + hooks + API
- **App routes:** thin `page.tsx` / `layout.tsx` only under `src/app/admin/(dashboard)/…` (canonical URLs `/admin/…`)
- **Shared:** `src/lib/admin/*` — auth headers, API base, **route constants**, **permissions**

### Layer rules (ESLint)

1. `src/components/**` must not import `@/features/**` or `@/app/**`
2. `src/features/admin/**` must not import `@/app/shamell-admin/**` (anti-regression; that folder must not be recreated)

### Design system: `data-display`

Import from `@/components/admin/data-display` (also re-exported via `@/components/admin`).

- **List pattern:** feature mounts `Table` + `EmptyState` + `Pagination`. Pagination meta comes from `@/lib/pagination`.
- **`Table`:** `rows.length === 0` → renders `null`; the feature must show `EmptyState`. Variants: `standalone` (default bordered card) | `embedded` (inside glass section, no outer border).
- **Row icon buttons:** use `tableIconBtnClass` / `tableIconBtnDangerClass` / `tableIconBtnDisabledClass` only (no `adminTable*` aliases).
- **Client vs server:** `Table`, `EmptyState`, and `Pagination` are `"use client"`. `DefinitionList` is server-safe (no client directive).

Co-located Vitest: `npx vitest run src/components/admin/data-display`.

---

## Feature module template

```text
features/admin/<module>/
  components/ hooks/ services/ types/ lib/ index.ts
  test/          # fixtures, MSW handlers, RTL utils (not primary unit suites)
  *.spec.ts(x)   # co-located next to lib/services/hooks/components

app/admin/(dashboard)/<module>/
  page.tsx    # thin reexport from @/features/admin/<module>
  layout.tsx  # metadata only
```

Vitest: co-located `*.spec.ts` / `*.spec.tsx` only (see `vitest.config.ts`); shared setup under `src/test/`. Reference: `features/admin/about`.

### Alias: `upcoming-events`

Do **not** create `features/admin/upcoming-events`. That URL is a legacy shim only:

- **Redirect:** `/admin/upcoming-events` → `/admin/on-coming-events` in `next.config.ts` (permanent)
- Real UI: `features/admin/on-coming-events` (+ `features/admin/events` with `upcomingOnly`)
- Constant: `UPCOMING_EVENTS_ADMIN_PATH` in `lib/admin/routes.ts` (legacy URL; do not expand into a feature)

### Shared display: `inquiries`

`features/admin/inquiries` is **shared UI/helpers** (detail rows, readable inquiry panel) used by peticiones, payment-history, and `lib/agenda`. There is **no** app route for it. URL `/admin/inquiries` redirects permanently to `/admin/agenda/peticiones` via `next.config.ts`.

### Compat shims: `app/admin/shared/lib`

Thin re-exports of `@/lib/admin/{auth,apiBaseUrl,routes,pricing}` for legacy imports. **Canon for new code is `@/lib/admin/*`.** Do not add new callers to `@/app/admin/shared/lib/*`.

### Other legacy admin redirects (`next.config.ts`)

- `/admin/invite-admin` → `/admin/agregar-admin`
- `/admin/dashboard` → `/admin/agenda`
- `/admin/inquiries` → `/admin/agenda/peticiones`
- `/shamell-admin/*` → `/admin/*`

### RBAC (coarse roles + typed permissions)

- Backend roles: `SUPER_ADMIN` | `ADMIN` | `CLIENT`
- JWT + login user include `permissions[]` **derived** from role (`lib`/`common` maps stay in sync)
- `SUPER_ADMIN` has `admin.invite`; invited users are created as `ADMIN`
- Frontend: `useAdminSession().permissions` + nav `requiredPermissions` + route deny on Add admin

### Icons

- Import nav/shell icons from `@/components/admin/icons` (Lucide behind stable names). Replace mappings there when custom SVGs arrive; nav stays stable.

### Shared services query

- `useServicesQuery` / `fetchAdminServicesShared` / `fetchAdminServicesRawShared` in `features/admin/services/hooks/useServicesQuery.ts`

### Migration status

| Area | Status |
|------|--------|
| shell, auth, inquiries display | done |
| services + CRUD catalog modules | done (features) |
| agenda/*, venue-*, on-coming-events | done (features) |
| Routes centralized in `lib/admin/routes.ts` | done |
| Single app tree `app/admin` + next.config redirects from `/shamell-admin` | done |
| DS canonical names (COMPAT Admin* purged) | done |
| `useAdminSession` + coarse RBAC + derived permissions | done |
| `useServicesQuery` shared | done |
| Icons Lucide facade | done |
| Public gallery (`app/gallery` thin → `features/gallery`) | done |
| Public forgot-password (`app/forgot-password` thin → `features/forgot-password`) | done |

---

## Deferred

- Finer permission matrix in DB / permission editor UI
- Custom SVG icon artwork (facade ready)
- Unificar Agendar catalog endpoint with `useServicesQuery`
