/**
 * Smoke test: forgot/reset password routes must not 404.
 * Usage: npm run build && npm run start (in another terminal), then npm run smoke:forgot-password
 * Override base: SMOKE_BASE_URL=http://localhost:3010 node scripts/smoke-forgot-password-routes.mjs
 */

const BASE = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

const isNotFound = (s) => s === 404;

const cases = [
  {
    name: "forgot-password root",
    path: "/forgot-password",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "forgot-password reset",
    path: "/forgot-password/reset",
    expectStatus: (s) => !isNotFound(s),
  },
  {
    name: "forgot-password reset with token",
    path: "/forgot-password/reset?token=test",
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

console.log("\nAll forgot-password-route smoke tests passed.");
