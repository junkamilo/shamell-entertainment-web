import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { deleteAdminVenueTablesBulk } from "./deleteAdminVenueTablesBulk";

describe("deleteAdminVenueTablesBulk", () => {
  const payload = { scope: "SIZE" as const, size: "LARGE" as const };

  it("returns deletedCount on success", async () => {
    server.use(
      http.delete("*/api/v1/venue-tables/admin/bulk", () =>
        HttpResponse.json({ deletedCount: 2, ok: true }),
      ),
    );
    const result = await deleteAdminVenueTablesBulk("token-1", payload);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.deletedCount).toBe(2);
  });

  it("sends JSON body with bearer token", async () => {
    let auth: string | null = null;
    let received: unknown = null;
    server.use(
      http.delete("*/api/v1/venue-tables/admin/bulk", async ({ request }) => {
        auth = request.headers.get("Authorization");
        received = await request.json();
        return HttpResponse.json({ deletedCount: 1, ok: true });
      }),
    );
    await deleteAdminVenueTablesBulk("token-1", payload);
    expect(auth).toBe("Bearer token-1");
    expect(received).toEqual(payload);
  });

  it("returns ok false on error", async () => {
    server.use(
      http.delete("*/api/v1/venue-tables/admin/bulk", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    const result = await deleteAdminVenueTablesBulk("token-1", payload);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
  });
});
