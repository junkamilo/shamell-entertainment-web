import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchAdminFloorLayoutPalette } from "./fetchAdminFloorLayoutPalette";

const ROUTE = "*/api/v1/floor-layout/admin/palette";

describe("fetchAdminFloorLayoutPalette", () => {
  it("loads mapped palette on success", async () => {
    const result = await fetchAdminFloorLayoutPalette("token-1");
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.palette?.tablesBySize.LARGE).toBeGreaterThan(0);
  });

  it("sends bearer token", async () => {
    let auth: string | null = null;
    server.use(
      http.get(ROUTE, ({ request }) => {
        auth = request.headers.get("Authorization");
        return HttpResponse.json({});
      }),
    );
    await fetchAdminFloorLayoutPalette("token-1");
    expect(auth).toBe("Bearer token-1");
  });

  it("returns ok:false on API error", async () => {
    server.use(http.get(ROUTE, () => HttpResponse.json({}, { status: 403 })));
    const result = await fetchAdminFloorLayoutPalette("token-1");
    expect(result).toEqual({ ok: false, palette: null, status: 403 });
  });
});
