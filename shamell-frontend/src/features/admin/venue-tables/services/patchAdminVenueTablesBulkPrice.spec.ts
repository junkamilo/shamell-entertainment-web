import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { patchAdminVenueTablesBulkPrice } from "./patchAdminVenueTablesBulkPrice";

describe("patchAdminVenueTablesBulkPrice", () => {
  const payload = { scope: "SIZE" as const, size: "LARGE" as const, bundlePrice: 275 };

  it("returns updatedCount on success", async () => {
    server.use(
      http.patch("*/api/v1/venue-tables/admin/bulk-price", () =>
        HttpResponse.json({ updatedCount: 2, ok: true }),
      ),
    );
    const result = await patchAdminVenueTablesBulkPrice("token-1", payload);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.updatedCount).toBe(2);
  });

  it("sends JSON body with bearer token", async () => {
    let auth: string | null = null;
    let received: unknown = null;
    server.use(
      http.patch("*/api/v1/venue-tables/admin/bulk-price", async ({ request }) => {
        auth = request.headers.get("Authorization");
        received = await request.json();
        return HttpResponse.json({ updatedCount: 3, ok: true });
      }),
    );
    await patchAdminVenueTablesBulkPrice("token-1", payload);
    expect(auth).toBe("Bearer token-1");
    expect(received).toEqual(payload);
  });

  it("returns ok false on error", async () => {
    server.use(
      http.patch("*/api/v1/venue-tables/admin/bulk-price", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    const result = await patchAdminVenueTablesBulkPrice("token-1", payload);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
  });
});
