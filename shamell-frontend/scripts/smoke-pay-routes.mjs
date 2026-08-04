/**
 * Smoke test: public pay token entry routes must not 404; missing token redirects home.
 * Usage: npm run build && npm run start (in another terminal), then npm run smoke:pay
 * Override base: SMOKE_BASE_URL=http://localhost:3010 node scripts/smoke-pay-routes.mjs
 *
 * Stripe return routes are covered by smoke:returns.
 */

const BASE = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

const isRedirect = (s) => s === 307 || s === 308;
const isNotFound = (s) => s === 404;

const cases = [
  {
    name: "pay quote with token",
    path: "/pay/quote?token=test",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "pay class with token",
    path: "/pay/class?token=test",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "pay venue-seat with token",
    path: "/pay/venue-seat?token=test",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "pay quote without token redirects home",
    path: "/pay/quote",
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

console.log("\nAll pay-route smoke tests passed.");
