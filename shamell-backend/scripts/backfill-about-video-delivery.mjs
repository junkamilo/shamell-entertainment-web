#!/usr/bin/env node
/**
 * One-off: persist About video delivery URLs and warm Cloudinary CDN.
 *
 * Usage (from shamell-backend, with env loaded):
 *   node scripts/backfill-about-video-delivery.mjs
 *   node scripts/backfill-about-video-delivery.mjs --warm
 *
 * Or via admin API:
 *   POST /api/v1/about/admin/backfill-video-delivery?warm=1
 *   Authorization: Bearer <admin-jwt>
 */

const warm = process.argv.includes("--warm");
const base =
  process.env.BACKEND_URL?.trim() ||
  process.env.API_BASE_URL?.trim() ||
  "http://localhost:3001";
const token = process.env.ADMIN_ACCESS_TOKEN?.trim();

if (!token) {
  console.error(
    "Set ADMIN_ACCESS_TOKEN (admin JWT) to call POST /api/v1/about/admin/backfill-video-delivery",
  );
  process.exit(1);
}

const url = `${base.replace(/\/$/, "")}/api/v1/about/admin/backfill-video-delivery${warm ? "?warm=1" : ""}`;

const response = await fetch(url, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
});

const body = await response.json().catch(() => ({}));
if (!response.ok) {
  console.error("Backfill failed:", response.status, body);
  process.exit(1);
}

console.log(JSON.stringify(body, null, 2));
