import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { postAdminVenueTable } from "./postAdminVenueTable";
import { FIXTURE_TABLE_ID } from "../test/fixtures/uuids.fixture";

describe("postAdminVenueTable", () => {
  const payload = {
    size: "LARGE" as const,
    includedChairs: 8,
    bundlePrice: 250,
    isActive: true,
  };

  it("creates and maps item on success", async () => {
    const result = await postAdminVenueTable("token-1", payload);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.item?.id).toBe(FIXTURE_TABLE_ID);
  });

  it("sends JSON body with bearer token", async () => {
    let auth: string | null = null;
    let received: unknown = null;
    server.use(
      http.post("*/api/v1/venue-tables/admin", async ({ request }) => {
        auth = request.headers.get("Authorization");
        received = await request.json();
        return HttpResponse.json({ id: FIXTURE_TABLE_ID, tableName: "Large 1" });
      }),
    );
    await postAdminVenueTable("token-1", payload);
    expect(auth).toBe("Bearer token-1");
    expect(received).toEqual(payload);
  });

  it("returns null item on error", async () => {
    server.use(
      http.post("*/api/v1/venue-tables/admin", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    const result = await postAdminVenueTable("token-1", payload);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
    expect(result.item).toBeNull();
  });
});
