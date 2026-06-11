/**
 * Runs the local Prisma CLI with `node` (required on Windows).
 *
 * If prisma/build/index.js is missing, Windows Defender may have quarantined it.
 * Add an exclusion for this repo, restore the file from Protection history, then:
 *   npm ci
 *   node scripts/run-prisma.mjs generate
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, "..");
const cliEntry = join(backendRoot, "node_modules", "prisma", "build", "index.js");
const prismaArgs = process.argv.slice(2);

if (!existsSync(cliEntry)) {
  console.error(`Prisma CLI not found: ${cliEntry}`);
  console.error("");
  console.error(
    "Windows Defender often quarantines this file as 'potentially unwanted software'.",
  );
  console.error("Fix:");
  console.error("  1. Windows Security → Protection history → restore prisma index.js");
  console.error(
    "  2. Add folder exclusion: C:\\shamell-s-golden-stage (requires Administrator)",
  );
  console.error("  3. npm ci");
  console.error("  4. node scripts/run-prisma.mjs generate");
  process.exit(1);
}

/** Prefer Node 22 LTS on Windows when Node 25 blocks reading the CLI bundle. */
function resolveNodeBinary() {
  if (process.platform !== "win32") {
    return process.execPath;
  }

  const candidates = [
    process.env.PRISMA_NODE,
    "C:\\Program Files\\nodejs\\node.exe",
    process.execPath,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    try {
      readFileSync(cliEntry);
      return candidate;
    } catch {
      // try next node binary
    }
  }

  return process.execPath;
}

const nodeBin = resolveNodeBinary();
const result = spawnSync(nodeBin, [cliEntry, ...prismaArgs], {
  cwd: backendRoot,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
