/**
 * Smoke test: all Stripe return routes must not 404.
 * Usage: npm run build && npm run start (in another terminal), then npm run smoke:returns
 * Override base: SMOKE_BASE_URL=http://localhost:3010 node scripts/smoke-return-routes.mjs
 */

const BASE = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const cases = [
  {
    name: "venue canonical return",
    path: "/on-coming-events/return?session_id=test&event_slug=test",
    expectStatus: (s) => s === 200,
  },
  {
    name: "class session return",
    path: "/on-coming-events/test-slug/classes/return?session_id=test",
    expectStatus: (s) => s === 200,
  },
  {
    name: "class package return",
    path: "/on-coming-events/test-slug/classes/package-return?session_id=test",
    expectStatus: (s) => s === 200,
  },
  {
    name: "fixed ticket return",
    path: "/on-coming-events/test-slug/return?session_id=test",
    expectStatus: (s) => s === 200,
  },
  {
    name: "booking quote return",
    path: "/pay/quote/return?session_id=test",
    expectStatus: (s) => s === 200,
  },
  {
    name: "venue seat pay return",
    path: "/pay/venue-seat/return?session_id=test",
    expectStatus: (s) => s === 200,
  },
  {
    name: "legacy venue seats return (slug)",
    path: "/on-coming-events/test-slug/seats/return?session_id=test",
    expectStatus: (s) => s === 307 || s === 308,
  },
  {
    name: "legacy venue seats return (no slug)",
    path: "/on-coming-events/seats/return?session_id=test",
    expectStatus: (s) => s === 307 || s === 308,
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
      console.error(`FAIL ${test.name} — expected pass, got ${response.status} for ${url}`);
      failed += 1;
    }
  } catch (err) {
    console.error(`FAIL ${test.name} — ${err instanceof Error ? err.message : String(err)}`);
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`\n${failed} smoke test(s) failed. Is the server running at ${BASE}?`);
  process.exit(1);
}

console.log("\nAll return-route smoke tests passed.");
