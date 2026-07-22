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

---

## Feature module template

```text
features/admin/<module>/
  components/ hooks/ services/ types/ lib/ index.ts

app/admin/(dashboard)/<module>/
  page.tsx    # thin reexport from @/features/admin/<module>
  layout.tsx  # metadata only
```

### Alias: `upcoming-events`

Do **not** create `features/admin/upcoming-events`. That URL is a shim only:

- Thin route: `app/admin/(dashboard)/upcoming-events/page.tsx` → redirects to `/admin/on-coming-events`
- Real UI: `features/admin/on-coming-events` (+ `features/admin/events` with `upcomingOnly`)
- Constant: `UPCOMING_EVENTS_ADMIN_PATH` in `lib/admin/routes.ts` (legacy URL; do not expand into a feature)

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

---

## Deferred

- Finer permission matrix in DB / permission editor UI
- Custom SVG icon artwork (facade ready)
- Unificar Agendar catalog endpoint with `useServicesQuery`
