import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchAdminFloorLayout } from "./fetchAdminFloorLayout";
import { FIXTURE_LAYOUT_ID } from "../../test/fixtures/uuids.fixture";

const ROUTE = "*/api/v1/floor-layout/admin";

describe("fetchAdminFloorLayout", () => {
  it("loads mapped layout on success", async () => {
    const result = await fetchAdminFloorLayout("token-1");
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.layout?.id).toBe(FIXTURE_LAYOUT_ID);
    expect(result.layout?.items.length).toBeGreaterThan(0);
  });

  it("sends bearer token", async () => {
    let auth: string | null = null;
    server.use(
      http.get(ROUTE, ({ request }) => {
        auth = request.headers.get("Authorization");
        return HttpResponse.json({});
      }),
    );
    await fetchAdminFloorLayout("token-1");
    expect(auth).toBe("Bearer token-1");
  });

  it("returns ok:false on API error", async () => {
    server.use(
      http.get(ROUTE, () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    const result = await fetchAdminFloorLayout("token-1");
    expect(result.ok).toBe(false);
    expect(result.layout).toBeNull();
    expect(result.status).toBe(500);
  });
});
