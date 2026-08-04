/**
 * Smoke test: admin canonical routes must not 404; legacy URLs must redirect.
 * Usage: npm run build && npm run start (in another terminal), then npm run smoke:admin-routes
 * Override base: SMOKE_BASE_URL=http://localhost:3010 node scripts/smoke-admin-routes.mjs
 */

const BASE = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

const isRedirect = (s) => s === 307 || s === 308;
const isNotFound = (s) => s === 404;

const cases = [
  // Legacy redirects (permanent in next.config → prefer 308; accept 307)
  {
    name: "legacy invite-admin",
    path: "/admin/invite-admin",
    expectStatus: isRedirect,
  },
  {
    name: "legacy upcoming-events",
    path: "/admin/upcoming-events",
    expectStatus: isRedirect,
  },
  {
    name: "legacy dashboard",
    path: "/admin/dashboard",
    expectStatus: isRedirect,
  },
  {
    name: "legacy inquiries",
    path: "/admin/inquiries",
    expectStatus: isRedirect,
  },
  {
    name: "legacy shamell-admin root",
    path: "/shamell-admin",
    expectStatus: isRedirect,
  },
  {
    name: "legacy shamell-admin agenda",
    path: "/shamell-admin/agenda",
    expectStatus: isRedirect,
  },
  {
    name: "legacy login",
    path: "/login",
    expectStatus: isRedirect,
  },
  // Canonical routes — must not 404 (auth may still render shell / client gate)
  {
    name: "admin login",
    path: "/admin/login",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "admin home",
    path: "/admin",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "admin agenda hub",
    path: "/admin/agenda",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "admin agendar",
    path: "/admin/agenda/agendar",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "admin disponibilidad",
    path: "/admin/agenda/disponibilidad",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "admin mi-agenda",
    path: "/admin/agenda/mi-agenda",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "admin peticiones",
    path: "/admin/agenda/peticiones",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "admin payment-history",
    path: "/admin/agenda/payment-history",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "admin box-office",
    path: "/admin/agenda/box-office",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "admin stripe-webhooks",
    path: "/admin/agenda/stripe-webhooks",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "admin services",
    path: "/admin/services",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "admin service-types",
    path: "/admin/service-types",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "admin occasion-types",
    path: "/admin/occasion-types",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "admin event-types",
    path: "/admin/event-types",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "admin events",
    path: "/admin/events",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "admin gallery",
    path: "/admin/gallery",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "admin gallery-categories",
    path: "/admin/gallery-categories",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "admin header-media",
    path: "/admin/header-media",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "admin about",
    path: "/admin/about",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "admin agregar-admin",
    path: "/admin/agregar-admin",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "admin venue-tables",
    path: "/admin/venue-tables",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "admin venue-reservations",
    path: "/admin/venue-reservations",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "admin on-coming-events",
    path: "/admin/on-coming-events",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "admin on-coming-events layout",
    path: "/admin/on-coming-events/layout",
    expectStatus: (s) => !isNotFound(s),
  },
];

let failed = 0;

for (const test of cases) {
  const url = `${BASE}${test.path}`;
  try {
    const response = await fetch(url, { redirect: "manual" });
    const ok = test.expectStatus(response.status);
    if (ok) {
      console.log(`OK  ${test.name} (${response.status})`);
    } else {
      console.error(
        `FAIL ${test.name} — unexpected status ${response.status} for ${url}`,
      );
      failed += 1;
    }
  } catch (err) {
    console.error(
      `FAIL ${test.name} — ${err instanceof Error ? err.message : String(err)}`,
    );
    failed += 1;
  }
}

if (failed > 0) {
  console.error(
    `\n${failed} smoke test(s) failed. Is the server running at ${BASE}?`,
  );
  process.exit(1);
}

console.log("\nAll admin-route smoke tests passed.");
