import { http, HttpResponse } from "msw";
import {
  makeStandaloneChairConfig,
  makeVenueTable,
  makeVenueTablesApiPayload,
} from "../fixtures/venueTables.fixture";
import { FIXTURE_TABLE_ID } from "../fixtures/uuids.fixture";

/**
 * Specific paths (bulk, bulk-price, all) MUST be registered before `:id`
 * wildcards so MSW matches them first.
 */
export const venueTablesHandlers = [
  http.get("*/api/v1/venue-tables/admin", () => {
    return HttpResponse.json(makeVenueTablesApiPayload());
  }),

  http.post("*/api/v1/venue-tables/admin/bulk", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      quantity?: number;
      size?: string;
    };
    const qty = Number(body.quantity ?? 1);
    const created = Array.from({ length: qty }, (_, i) =>
      makeVenueTable({
        id: `bulk-${i + 1}`,
        tableName: `${body.size ?? "LARGE"} ${i + 1}`,
        size: (body.size as "LARGE" | "MEDIUM" | "SMALL") ?? "LARGE",
      }),
    );
    return HttpResponse.json({ created, count: created.length });
  }),

  http.post("*/api/v1/venue-tables/admin", () => {
    return HttpResponse.json(makeVenueTable());
  }),

  http.patch("*/api/v1/venue-tables/admin/bulk-price", () => {
    return HttpResponse.json({ updatedCount: 2, ok: true });
  }),

  http.patch("*/api/v1/venue-tables/admin/:id", ({ params }) => {
    return HttpResponse.json(
      makeVenueTable({ id: String(params.id ?? FIXTURE_TABLE_ID) }),
    );
  }),

  http.get("*/api/v1/venue-tables/admin/:id", ({ params }) => {
    return HttpResponse.json(
      makeVenueTable({ id: String(params.id ?? FIXTURE_TABLE_ID) }),
    );
  }),

  http.delete("*/api/v1/venue-tables/admin/bulk", () => {
    return HttpResponse.json({ deletedCount: 2, ok: true });
  }),

  http.delete("*/api/v1/venue-tables/admin/:id", () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/api/v1/standalone-chairs/admin", () => {
    return HttpResponse.json(makeStandaloneChairConfig());
  }),

  http.put("*/api/v1/standalone-chairs/admin", () => {
    return HttpResponse.json(makeStandaloneChairConfig({ availableQuantity: 5 }));
  }),

  http.patch("*/api/v1/standalone-chairs/admin/bulk-price", () => {
    return HttpResponse.json(makeStandaloneChairConfig({ unitPrice: 40 }));
  }),

  http.patch("*/api/v1/standalone-chairs/admin/:id", () => {
    return HttpResponse.json(makeStandaloneChairConfig({ unitPrice: 42 }));
  }),

  http.delete("*/api/v1/standalone-chairs/admin/all", () => {
    return HttpResponse.json(
      makeStandaloneChairConfig({
        availableQuantity: 0,
        chairs: [],
        totalCount: 0,
        reservedCount: 0,
      }),
    );
  }),

  http.delete("*/api/v1/standalone-chairs/admin/:id", () => {
    return HttpResponse.json(makeStandaloneChairConfig({ availableQuantity: 1 }));
  }),
];
