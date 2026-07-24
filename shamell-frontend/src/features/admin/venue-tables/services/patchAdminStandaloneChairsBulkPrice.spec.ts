import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { patchAdminStandaloneChairsBulkPrice } from "./patchAdminStandaloneChairsBulkPrice";
import { FIXTURE_CHAIR_CONFIG_ID } from "../test/fixtures/uuids.fixture";

describe("patchAdminStandaloneChairsBulkPrice", () => {
  it("returns mapped config on success", async () => {
    const result = await patchAdminStandaloneChairsBulkPrice("token-1", 40);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.config?.id).toBe(FIXTURE_CHAIR_CONFIG_ID);
    expect(result.config?.unitPrice).toBe(40);
  });

  it("sends unitPrice JSON with bearer token", async () => {
    let auth: string | null = null;
    let received: unknown = null;
    server.use(
      http.patch("*/api/v1/standalone-chairs/admin/bulk-price", async ({ request }) => {
        auth = request.headers.get("Authorization");
        received = await request.json();
        return HttpResponse.json({ id: FIXTURE_CHAIR_CONFIG_ID, unitPrice: 40 });
      }),
    );
    await patchAdminStandaloneChairsBulkPrice("token-1", 40);
    expect(auth).toBe("Bearer token-1");
    expect(received).toEqual({ unitPrice: 40 });
  });

  it("returns null config on error", async () => {
    server.use(
      http.patch("*/api/v1/standalone-chairs/admin/bulk-price", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    const result = await patchAdminStandaloneChairsBulkPrice("token-1", 40);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
    expect(result.config).toBeNull();
  });
});
