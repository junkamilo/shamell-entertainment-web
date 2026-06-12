/**
 * Mirror of backend venue-seat-display-label.util.spec.ts
 * Run: node scripts/verify-venue-seat-display-label.mjs
 */
import assert from "node:assert/strict";

const TECHNICAL_TABLE = /^(LARGE|MEDIUM|SMALL)-[a-f0-9]{8}$/i;
const TECHNICAL_CHAIR = /^CHAIR-[a-f0-9]{8}$/i;
const SIZE_LABELS = { LARGE: "Large", MEDIUM: "Medium", SMALL: "Small" };

function isTechnicalTableName(name) {
  return TECHNICAL_TABLE.test(name.trim());
}
function isTechnicalChairName(name) {
  return TECHNICAL_CHAIR.test(name.trim());
}
function shouldUseTableOrdinalLabel(name, size) {
  const trimmed = name.trim();
  if (!trimmed || isTechnicalTableName(trimmed)) return true;
  const lower = trimmed.toLowerCase();
  const sizeLabel = SIZE_LABELS[size].toLowerCase();
  return lower === sizeLabel || lower === `${sizeLabel} table` || lower === size.toLowerCase();
}
function shouldUseChairOrdinalLabel(name) {
  const trimmed = name.trim();
  if (!trimmed || isTechnicalChairName(trimmed)) return true;
  return trimmed.toLowerCase() === "chair";
}
function ordinalFromOrderedIds(ids, targetId) {
  const i = ids.indexOf(targetId);
  return i >= 0 ? i + 1 : 1;
}
function formatTableDisplayLabel(size, ordinal) {
  return `${SIZE_LABELS[size]} table ${ordinal}`;
}
function formatTableShortLabel(size, ordinal) {
  return `${SIZE_LABELS[size]} ${ordinal}`;
}
function formatChairDisplayLabel(ordinal) {
  return `Chair ${ordinal}`;
}

assert.equal(isTechnicalTableName("MEDIUM-a1b2c3d4"), true);
assert.equal(isTechnicalTableName("Mesa 1"), false);
assert.equal(isTechnicalChairName("CHAIR-deadbeef"), true);
assert.equal(formatTableDisplayLabel("LARGE", 1), "Large table 1");
assert.equal(formatTableShortLabel("MEDIUM", 2), "Medium 2");
assert.equal(formatChairDisplayLabel(3), "Chair 3");

const peers = ["table-a", "table-b", "table-c"];
assert.equal(
  formatTableDisplayLabel("MEDIUM", ordinalFromOrderedIds(peers, "table-b")),
  "Medium table 2",
);

assert.equal(shouldUseTableOrdinalLabel("Large", "LARGE"), true);
assert.equal(shouldUseTableOrdinalLabel("VIP table", "LARGE"), false);
assert.equal(shouldUseChairOrdinalLabel("Chair"), true);
assert.equal(shouldUseChairOrdinalLabel("CHAIR-deadbeef"), true);

console.log("verify-venue-seat-display-label: ok");
