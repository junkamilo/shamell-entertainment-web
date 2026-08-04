/**
 * Smoke test: public contact route must not 404 (including deep-link querystrings).
 * Usage: npm run build && npm run start (in another terminal), then npm run smoke:contacto
 * Override base: SMOKE_BASE_URL=http://localhost:3010 node scripts/smoke-contacto-routes.mjs
 */

const BASE = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

const isNotFound = (s) => s === 404;

const cases = [
  {
    name: "contacto root",
    path: "/contacto",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "contacto serviceType deep link",
    path: "/contacto?serviceType=VIP_EVENT&entry=home_service_card",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "contacto concierge gate entry",
    path: "/contacto?entry=concierge_gate",
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

console.log("\nAll contacto-route smoke tests passed.");
