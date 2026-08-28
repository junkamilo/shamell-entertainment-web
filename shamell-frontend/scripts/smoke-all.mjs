/**
 * Run all business-critical HTTP smoke packs (no backend required).
 * Usage: npm run build && npm run start (another terminal), then npm run smoke:all
 * Override base: SMOKE_BASE_URL=http://localhost:3010 npm run smoke:all
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const packs = [
  { name: "returns", file: "smoke-return-routes.mjs" },
  { name: "home", file: "smoke-home-routes.mjs" },
  { name: "contacto", file: "smoke-contacto-routes.mjs" },
  { name: "gallery", file: "smoke-gallery-routes.mjs" },
  { name: "pay", file: "smoke-pay-routes.mjs" },
  { name: "on-coming-events", file: "smoke-on-coming-events-routes.mjs" },
  { name: "admin-routes", file: "smoke-admin-routes.mjs" },
  { name: "forgot-password", file: "smoke-forgot-password-routes.mjs" },
];

const base = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

console.log(`smoke:all — SMOKE_BASE_URL=${base}\n`);

const failed = [];

for (const pack of packs) {
  const scriptPath = path.join(__dirname, pack.file);
  console.log(`── smoke:${pack.name} ──`);
  const result = spawnSync(process.execPath, [scriptPath], {
    env: process.env,
    stdio: "inherit",
  });
  const code = result.status ?? 1;
  if (code !== 0) {
    failed.push(pack.name);
    console.error(`FAIL pack smoke:${pack.name} (exit ${code})\n`);
  } else {
    console.log(`OK   pack smoke:${pack.name}\n`);
  }
}

if (failed.length > 0) {
  console.error(
    `smoke:all — ${failed.length} pack(s) failed: ${failed.join(", ")}`,
  );
  process.exit(1);
}

console.log("smoke:all — all packs passed.");
