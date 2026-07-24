import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { deleteAdminVenueTable } from "./deleteAdminVenueTable";
import { FIXTURE_TABLE_ID } from "../test/fixtures/uuids.fixture";

describe("deleteAdminVenueTable", () => {
  it("returns ok on success", async () => {
    const result = await deleteAdminVenueTable("token-1", FIXTURE_TABLE_ID);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(204);
  });

  it("sends bearer token to the table id", async () => {
    let auth: string | null = null;
    let url = "";
    server.use(
      http.delete("*/api/v1/venue-tables/admin/:id", ({ request }) => {
        auth = request.headers.get("Authorization");
        url = request.url;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await deleteAdminVenueTable("token-1", FIXTURE_TABLE_ID);
    expect(auth).toBe("Bearer token-1");
    expect(url).toContain(FIXTURE_TABLE_ID);
  });

  it("returns ok false on error", async () => {
    server.use(
      http.delete("*/api/v1/venue-tables/admin/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    const result = await deleteAdminVenueTable("token-1", FIXTURE_TABLE_ID);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
  });
});
