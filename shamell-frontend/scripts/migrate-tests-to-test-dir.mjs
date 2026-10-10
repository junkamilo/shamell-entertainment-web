#!/usr/bin/env node
/**
 * Codemod: migra specs + infra de test de un módulo de `src/` al árbol central `test/`
 * (guía: migracion-tests-about.md). El código de producción no se mueve.
 *
 * Uso:  node scripts/migrate-tests-to-test-dir.mjs features/admin/agenda [--dry]
 *
 * Reglas de destino (ruta relativa a src/):
 *   <ruta>/X.spec.ts(x)                       → test/<ruta>/X.spec.ts(x)
 *   <mod>/test(s)/[sub/]X.spec.ts(x)          → test/<mod>/[sub/]X.spec.ts(x)
 *   <mod>/test(s)/utils/X                     → test/<mod>/support/helpers/X
 *   <mod>/test(s)/<resto>                     → test/<mod>/support/<resto>
 *
 * Imports: cada especificador relativo o `@/` se resuelve contra la ubicación ORIGINAL;
 * si apunta a un archivo movido → `@test/…`, si apunta a producción → `@/…`.
 * También reescribe referencias a archivos movidos desde el resto del repo.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const SRC = path.join(ROOT, "src");
const TEST = path.join(ROOT, "test");
const CODE_EXT = [".ts", ".tsx", ".mts", ".js", ".mjs", ".jsx"];
const RESOLVE_EXT = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".mts", ".json"];

const [moduleArg, ...flags] = process.argv.slice(2);
const DRY = flags.includes("--dry");
if (!moduleArg) {
  console.error("Uso: node scripts/migrate-tests-to-test-dir.mjs <ruta-bajo-src> [--dry]");
  process.exit(1);
}
const MODULE_DIR = path.join(SRC, moduleArg);
if (!fs.existsSync(MODULE_DIR)) throw new Error(`No existe ${MODULE_DIR}`);

const posix = (p) => p.split(path.sep).join("/");
const isSpec = (f) => /\.spec\.(ts|tsx)$/.test(f);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

// ── 1. Plan de movimientos ───────────────────────────────────────────────
/** @type {Map<string, string>} origen absoluto → destino absoluto */
const moves = new Map();
for (const file of walk(MODULE_DIR)) {
  const rel = path.relative(SRC, file);
  const parts = rel.split(path.sep);
  const testIdx = parts.findIndex((p, i) => i < parts.length - 1 && (p === "test" || p === "tests"));
  let dest = null;
  if (testIdx >= 0) {
    const prefix = parts.slice(0, testIdx);
    let rest = parts.slice(testIdx + 1);
    if (isSpec(file)) {
      dest = path.join(TEST, ...prefix, ...rest);
    } else {
      if (rest[0] === "utils") rest = ["helpers", ...rest.slice(1)];
      dest = path.join(TEST, ...prefix, "support", ...rest);
    }
  } else if (isSpec(file)) {
    dest = path.join(TEST, rel);
  }
  if (dest) moves.set(file, dest);
}
const destinations = new Set();
for (const dest of moves.values()) {
  if (destinations.has(dest) || fs.existsSync(dest)) throw new Error(`Colisión de destino: ${dest}`);
  destinations.add(dest);
}

// ── 2. Resolución de especificadores ────────────────────────────────────
function resolveFile(base) {
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return { file: base, viaIndex: false };
  for (const ext of RESOLVE_EXT) if (fs.existsSync(base + ext)) return { file: base + ext, viaIndex: false };
  for (const ext of RESOLVE_EXT) {
    const idx = path.join(base, "index" + ext);
    if (fs.existsSync(idx)) return { file: idx, viaIndex: true };
  }
  return null;
}

function stripExt(p) {
  return p.replace(/\.(tsx?|mts|jsx?|mjs)$/, "");
}

/**
 * @param spec especificador original
 * @param fromOrig ubicación original del archivo que importa (para resolver)
 * @param fromNew ubicación nueva del archivo que importa
 */
function rewriteSpecifier(spec, fromOrig, fromNew) {
  let targetBase;
  if (spec.startsWith("./") || spec.startsWith("../")) targetBase = path.resolve(path.dirname(fromOrig), spec);
  else if (spec.startsWith("@/")) targetBase = path.join(SRC, spec.slice(2));
  else return spec;

  const resolved = resolveFile(targetBase);
  const hadExt = /\.[a-z]+$/i.test(spec) && resolved && path.extname(spec) === path.extname(resolved.file);

  if (resolved && moves.has(resolved.file)) {
    const movedTo = moves.get(resolved.file);
    let out = posix(path.relative(TEST, resolved.viaIndex ? path.dirname(movedTo) : movedTo));
    if (!resolved.viaIndex && !hadExt) out = stripExt(out);
    return "@test/" + out;
  }

  const fromMoved = fromOrig !== fromNew;
  if (!fromMoved) return spec; // archivo que no se mueve: solo cambian refs a archivos movidos
  if (spec.startsWith("@/")) return spec;
  const insideSrc = !path.relative(SRC, targetBase).startsWith("..");
  if (insideSrc) return "@/" + posix(path.relative(SRC, targetBase));
  // Fuera de src (p.ej. public/): relativo desde la nueva ubicación.
  let rel = posix(path.relative(path.dirname(fromNew), targetBase));
  if (!rel.startsWith(".")) rel = "./" + rel;
  return rel;
}

const SPEC_RE =
  /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\bvi\.(?:mock|doMock|unmock|importActual|importMock)(?:<[^>()]*>)?\(\s*|\brequire\(\s*|\brequire\.resolve\(\s*)(["'])([^"'\n]+)\2/g;

function rewriteContent(content, fromOrig, fromNew) {
  let changed = false;
  const out = content.replace(SPEC_RE, (match, lead, quote, spec) => {
    const next = rewriteSpecifier(spec, fromOrig, fromNew);
    if (next === spec) return match;
    changed = true;
    return `${lead}${quote}${next}${quote}`;
  });
  return { out, changed };
}

// ── 3. Ejecutar ─────────────────────────────────────────────────────────
const report = { moved: 0, rewrittenMoved: 0, rewrittenOthers: [] };

// 3a. Archivos externos (no movidos) que referencian archivos movidos.
const externalRoots = ["src", "test", "e2e", "scripts"].map((d) => path.join(ROOT, d)).filter(fs.existsSync);
const externalFiles = externalRoots
  .flatMap((d) => walk(d))
  .filter((f) => CODE_EXT.includes(path.extname(f)) && !moves.has(f) && f !== fileURLToPathSafe());
function fileURLToPathSafe() {
  return path.join(ROOT, "scripts", "migrate-tests-to-test-dir.mjs");
}
const externalEdits = [];
for (const file of externalFiles) {
  const content = fs.readFileSync(file, "utf8");
  const { out, changed } = rewriteContent(content, file, file);
  if (changed) externalEdits.push([file, out]);
}

// 3b. Contenido reescrito de los movidos (calculado antes de mover, con rutas originales).
const movedEdits = [];
for (const [from, to] of moves) {
  if (!CODE_EXT.includes(path.extname(from))) continue;
  const content = fs.readFileSync(from, "utf8");
  const { out, changed } = rewriteContent(content, from, to);
  if (changed) movedEdits.push([to, out]);
}

if (DRY) {
  for (const [from, to] of moves) console.log(`${posix(path.relative(ROOT, from))}  →  ${posix(path.relative(ROOT, to))}`);
  console.log(`\n[dry] ${moves.size} movimientos, ${movedEdits.length} movidos con imports reescritos, ${externalEdits.length} externos a editar:`);
  for (const [f] of externalEdits) console.log("  ext:", posix(path.relative(ROOT, f)));
  process.exit(0);
}

for (const [from, to] of moves) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  execFileSync("git", ["mv", from, to], { cwd: ROOT });
  report.moved++;
}
for (const [file, out] of movedEdits) {
  fs.writeFileSync(file, out);
  report.rewrittenMoved++;
}
for (const [file, out] of externalEdits) {
  fs.writeFileSync(file, out);
  report.rewrittenOthers.push(posix(path.relative(ROOT, file)));
}

// Borrar directorios que quedaron vacíos dentro del módulo.
function pruneEmpty(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) pruneEmpty(path.join(dir, entry.name));
  }
  if (dir !== MODULE_DIR && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
}
pruneEmpty(MODULE_DIR);

console.log(`Movidos: ${report.moved}`);
console.log(`Movidos con imports reescritos: ${report.rewrittenMoved}`);
console.log(`Externos reescritos (${report.rewrittenOthers.length}):`);
for (const f of report.rewrittenOthers) console.log("  " + f);
