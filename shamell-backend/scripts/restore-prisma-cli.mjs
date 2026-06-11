/**
 * Restores/runs the Prisma CLI when Windows Defender deletes
 * node_modules/prisma/build/index.js.
 *
 * Safe: local files only. `migrate deploy` only applies pending migrations;
 * it does NOT delete production data (never uses migrate reset).
 *
 * Usage (from shamell-backend):
 *   node scripts/restore-prisma-cli.mjs
 *   node scripts/restore-prisma-cli.mjs generate
 *   node scripts/restore-prisma-cli.mjs migrate deploy
 */
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, "..");
const prismaVersion =
  JSON.parse(readFileSync(join(backendRoot, "package.json"), "utf8")).dependencies
    ?.prisma?.replace(/^\^/, "") ?? "7.8.0";

const toolDir = join(homedir(), ".shamell-prisma-cli", prismaVersion);
const cliEntry = join(toolDir, "build", "index.js");
const projectCliEntry = join(
  backendRoot,
  "node_modules",
  "prisma",
  "build",
  "index.js",
);

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...opts,
  });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed (exit ${result.status})`);
  }
}

function ensureCliCached() {
  if (existsSync(cliEntry)) {
    console.log(`Prisma CLI cached at ${cliEntry}`);
    return;
  }

  mkdirSync(toolDir, { recursive: true });
  const packDir = join(toolDir, "_pack");
  mkdirSync(packDir, { recursive: true });

  console.log(`Downloading prisma@${prismaVersion} via npm pack...`);
  run("npm", ["pack", `prisma@${prismaVersion}`, "--pack-destination", packDir], {
    cwd: toolDir,
  });

  const tgzName = `prisma-${prismaVersion}.tgz`;
  const tgz = join(packDir, tgzName);
  if (!existsSync(tgz)) {
    throw new Error(`Expected tarball at ${tgz}`);
  }

  console.log("Extracting Prisma CLI...");
  const extracted = join(packDir, "package", "build", "index.js");
  // Use a relative tarball path — Windows tar treats `C:\...` as a remote host.
  run("tar", ["-xf", tgzName, "package/build/index.js"], { cwd: packDir });

  if (!existsSync(extracted)) {
    throw new Error(`Extract failed: ${extracted} not found`);
  }

  mkdirSync(dirname(cliEntry), { recursive: true });
  copyFileSync(extracted, cliEntry);

  console.log(`Prisma CLI ready at ${cliEntry}`);
}

function syncToProject() {
  try {
    mkdirSync(dirname(projectCliEntry), { recursive: true });
    copyFileSync(cliEntry, projectCliEntry);
    console.log(`Synced CLI to ${projectCliEntry}`);
  } catch (err) {
    console.warn(
      "Could not copy into node_modules (antivirus may block it). Using home cache.",
    );
    console.warn(err instanceof Error ? err.message : String(err));
  }
}

function runPrisma(args) {
  const result = spawnSync(process.execPath, [cliEntry, ...args], {
    cwd: backendRoot,
    stdio: "inherit",
    env: process.env,
  });
  process.exit(result.status ?? 1);
}

const prismaArgs = process.argv.slice(2);

ensureCliCached();
syncToProject();

if (prismaArgs.length === 0) {
  console.log("\nPrisma CLI restored.");
  console.log("Examples:");
  console.log("  node scripts/restore-prisma-cli.mjs generate");
  console.log("  node scripts/restore-prisma-cli.mjs migrate deploy");
  console.log(
    "\nmigrate deploy is safe for production: it only runs new SQL migrations, never wipes data.",
  );
  process.exit(0);
}

runPrisma(prismaArgs);
