/**
 * Smoke test: Agendar admin routes must not 404.
 * Usage: npm run build && npm run start (in another terminal), then npm run smoke:agendar
 * Override base: SMOKE_BASE_URL=http://localhost:3010 node src/app/shamell-admin/agenda/agendar/tests/smoke/agendar-routes.smoke.mjs
 */

const BASE = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const cases = [
  {
    name: "agendar base",
    path: "/shamell-admin/agenda/agendar",
    expectStatus: (s) => s === 200,
  },
  {
    name: "agendar class mode",
    path: "/shamell-admin/agenda/agendar?mode=class",
    expectStatus: (s) => s === 200,
  },
  {
    name: "agendar edit mode",
    path: "/shamell-admin/agenda/agendar?bookingId=550e8400-e29b-41d4-a716-446655440020",
    expectStatus: (s) => s === 200,
  },
  {
    name: "legacy login redirect",
    path: "/login",
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
  console.error(`\n${failed} agendar smoke test(s) failed. Is the server running at ${BASE}?`);
  process.exit(1);
}

console.log("\nAll agendar route smoke tests passed.");
