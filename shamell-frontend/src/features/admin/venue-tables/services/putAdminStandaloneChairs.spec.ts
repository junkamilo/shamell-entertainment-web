import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { putAdminStandaloneChairs } from "./putAdminStandaloneChairs";
import { FIXTURE_CHAIR_CONFIG_ID } from "../test/fixtures/uuids.fixture";

describe("putAdminStandaloneChairs", () => {
  const payload = { availableQuantity: 5, unitPrice: 35 };

  it("returns mapped config on success", async () => {
    const result = await putAdminStandaloneChairs("token-1", payload);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.config?.id).toBe(FIXTURE_CHAIR_CONFIG_ID);
    expect(result.config?.availableQuantity).toBe(5);
  });

  it("sends JSON body with bearer token", async () => {
    let auth: string | null = null;
    let received: unknown = null;
    server.use(
      http.put("*/api/v1/standalone-chairs/admin", async ({ request }) => {
        auth = request.headers.get("Authorization");
        received = await request.json();
        return HttpResponse.json({ id: FIXTURE_CHAIR_CONFIG_ID, availableQuantity: 5, unitPrice: 35 });
      }),
    );
    await putAdminStandaloneChairs("token-1", payload);
    expect(auth).toBe("Bearer token-1");
    expect(received).toEqual(payload);
  });

  it("returns null config on error", async () => {
    server.use(
      http.put("*/api/v1/standalone-chairs/admin", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    const result = await putAdminStandaloneChairs("token-1", payload);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
    expect(result.config).toBeNull();
  });
});
