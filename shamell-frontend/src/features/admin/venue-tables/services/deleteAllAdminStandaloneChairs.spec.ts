import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { deleteAllAdminStandaloneChairs } from "./deleteAllAdminStandaloneChairs";
import { FIXTURE_CHAIR_CONFIG_ID } from "../test/fixtures/uuids.fixture";

describe("deleteAllAdminStandaloneChairs", () => {
  it("returns mapped config on success", async () => {
    const result = await deleteAllAdminStandaloneChairs("token-1");
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.config?.id).toBe(FIXTURE_CHAIR_CONFIG_ID);
    expect(result.config?.availableQuantity).toBe(0);
    expect(result.config?.chairs).toEqual([]);
  });

  it("sends bearer token", async () => {
    let auth: string | null = null;
    server.use(
      http.delete("*/api/v1/standalone-chairs/admin/all", ({ request }) => {
        auth = request.headers.get("Authorization");
        return HttpResponse.json({ id: FIXTURE_CHAIR_CONFIG_ID, availableQuantity: 0, chairs: [] });
      }),
    );
    await deleteAllAdminStandaloneChairs("token-1");
    expect(auth).toBe("Bearer token-1");
  });

  it("returns null config on error", async () => {
    server.use(
      http.delete("*/api/v1/standalone-chairs/admin/all", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    const result = await deleteAllAdminStandaloneChairs("token-1");
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
    expect(result.config).toBeNull();
  });
});
