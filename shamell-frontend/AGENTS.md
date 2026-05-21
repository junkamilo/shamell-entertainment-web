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

## Verification

After structural changes: `npm run build` and a short manual smoke on the affected route.
