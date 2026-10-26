/**
 * Smoke test: public upcoming-events tree must not 404; legacy aliases must redirect.
 * Usage: npm run build && npm run start (in another terminal), then npm run smoke:on-coming-events
 * Override base: SMOKE_BASE_URL=http://localhost:3010 node scripts/smoke-on-coming-events-routes.mjs
 *
 * Stripe return routes are covered by smoke:returns — do not duplicate them here.
 */

const BASE = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

const isRedirect = (s) => s === 307 || s === 308;
const isNotFound = (s) => s === 404;

const cases = [
  {
    name: "upcoming-events hub",
    path: "/upcoming-events",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "upcoming-events detail",
    path: "/upcoming-events/test-slug",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "upcoming-events seats",
    path: "/upcoming-events/test-slug/seats",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "upcoming-events classes",
    path: "/upcoming-events/test-slug/classes",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "legacy on-coming-events",
    path: "/on-coming-events",
    expectStatus: isRedirect,
  },
  {
    name: "legacy venue-layout",
    path: "/venue-layout",
    expectStatus: isRedirect,
  },
  {
    name: "legacy registro",
    path: "/registro",
    expectStatus: isRedirect,
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

console.log("\nAll on-coming-events-route smoke tests passed.");
