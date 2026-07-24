import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchAdminStandaloneChairs } from "./fetchAdminStandaloneChairs";
import { FIXTURE_CHAIR_CONFIG_ID, FIXTURE_CHAIR_ID } from "../test/fixtures/uuids.fixture";

describe("fetchAdminStandaloneChairs", () => {
  it("returns mapped config on success", async () => {
    const result = await fetchAdminStandaloneChairs("token-1");
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.config?.id).toBe(FIXTURE_CHAIR_CONFIG_ID);
    expect(result.config?.chairs?.[0]?.id).toBe(FIXTURE_CHAIR_ID);
  });

  it("sends bearer token", async () => {
    let auth: string | null = null;
    server.use(
      http.get("*/api/v1/standalone-chairs/admin", ({ request }) => {
        auth = request.headers.get("Authorization");
        return HttpResponse.json({ id: null, availableQuantity: 0, unitPrice: 0 });
      }),
    );
    await fetchAdminStandaloneChairs("token-1");
    expect(auth).toBe("Bearer token-1");
  });

  it("returns null config on error", async () => {
    server.use(
      http.get("*/api/v1/standalone-chairs/admin", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    const result = await fetchAdminStandaloneChairs("token-1");
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
    expect(result.config).toBeNull();
  });
});
