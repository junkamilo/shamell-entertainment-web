import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchAdminVenueTable } from "./fetchAdminVenueTable";
import { FIXTURE_TABLE_ID } from "../test/fixtures/uuids.fixture";

describe("fetchAdminVenueTable", () => {
  it("returns mapped item on success", async () => {
    const result = await fetchAdminVenueTable("token-1", FIXTURE_TABLE_ID);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.item?.id).toBe(FIXTURE_TABLE_ID);
  });

  it("sends bearer token to the table id", async () => {
    let auth: string | null = null;
    let url = "";
    server.use(
      http.get("*/api/v1/venue-tables/admin/:id", ({ request }) => {
        auth = request.headers.get("Authorization");
        url = request.url;
        return HttpResponse.json({ id: FIXTURE_TABLE_ID, tableName: "Large 1" });
      }),
    );
    await fetchAdminVenueTable("token-1", FIXTURE_TABLE_ID);
    expect(auth).toBe("Bearer token-1");
    expect(url).toContain(FIXTURE_TABLE_ID);
  });

  it("returns null item on 404", async () => {
    server.use(
      http.get("*/api/v1/venue-tables/admin/:id", () =>
        HttpResponse.json({ message: "Not found" }, { status: 404 }),
      ),
    );
    const result = await fetchAdminVenueTable("token-1", FIXTURE_TABLE_ID);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
    expect(result.item).toBeNull();
  });
});
