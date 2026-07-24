import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { patchAdminVenueTable } from "./patchAdminVenueTable";
import { FIXTURE_TABLE_ID } from "../test/fixtures/uuids.fixture";

describe("patchAdminVenueTable", () => {
  const payload = { bundlePrice: 300 };

  it("updates and maps item on success", async () => {
    const result = await patchAdminVenueTable("token-1", FIXTURE_TABLE_ID, payload);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.item?.id).toBe(FIXTURE_TABLE_ID);
  });

  it("sends JSON body with bearer token", async () => {
    let auth: string | null = null;
    let received: unknown = null;
    server.use(
      http.patch("*/api/v1/venue-tables/admin/:id", async ({ request }) => {
        auth = request.headers.get("Authorization");
        received = await request.json();
        return HttpResponse.json({ id: FIXTURE_TABLE_ID, tableName: "Large 1" });
      }),
    );
    await patchAdminVenueTable("token-1", FIXTURE_TABLE_ID, payload);
    expect(auth).toBe("Bearer token-1");
    expect(received).toEqual(payload);
  });

  it("returns null item on error", async () => {
    server.use(
      http.patch("*/api/v1/venue-tables/admin/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    const result = await patchAdminVenueTable("token-1", FIXTURE_TABLE_ID, payload);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
    expect(result.item).toBeNull();
  });
});
