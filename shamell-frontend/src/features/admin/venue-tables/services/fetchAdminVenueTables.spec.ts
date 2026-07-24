import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchAdminVenueTables } from "./fetchAdminVenueTables";
import { FIXTURE_TABLE_ID } from "../test/fixtures/uuids.fixture";

describe("fetchAdminVenueTables", () => {
  it("returns mapped items on success", async () => {
    const result = await fetchAdminVenueTables("token-1");
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.items[0]?.id).toBe(FIXTURE_TABLE_ID);
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("sends bearer token", async () => {
    let auth: string | null = null;
    server.use(
      http.get("*/api/v1/venue-tables/admin", ({ request }) => {
        auth = request.headers.get("Authorization");
        return HttpResponse.json([]);
      }),
    );
    await fetchAdminVenueTables("token-1");
    expect(auth).toBe("Bearer token-1");
  });

  it("returns empty items on error", async () => {
    server.use(
      http.get("*/api/v1/venue-tables/admin", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    const result = await fetchAdminVenueTables("token-1");
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
    expect(result.items).toEqual([]);
  });
});
