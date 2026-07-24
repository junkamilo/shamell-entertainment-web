import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { deleteAdminStandaloneChair } from "./deleteAdminStandaloneChair";
import { FIXTURE_CHAIR_CONFIG_ID, FIXTURE_CHAIR_ID } from "../test/fixtures/uuids.fixture";

describe("deleteAdminStandaloneChair", () => {
  it("returns mapped config on success", async () => {
    const result = await deleteAdminStandaloneChair("token-1", FIXTURE_CHAIR_ID);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.config?.id).toBe(FIXTURE_CHAIR_CONFIG_ID);
  });

  it("sends bearer token to the chair id", async () => {
    let auth: string | null = null;
    let url = "";
    server.use(
      http.delete("*/api/v1/standalone-chairs/admin/:id", ({ request }) => {
        auth = request.headers.get("Authorization");
        url = request.url;
        return HttpResponse.json({ id: FIXTURE_CHAIR_CONFIG_ID, availableQuantity: 1 });
      }),
    );
    await deleteAdminStandaloneChair("token-1", FIXTURE_CHAIR_ID);
    expect(auth).toBe("Bearer token-1");
    expect(url).toContain(FIXTURE_CHAIR_ID);
  });

  it("returns null config on error", async () => {
    server.use(
      http.delete("*/api/v1/standalone-chairs/admin/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    const result = await deleteAdminStandaloneChair("token-1", FIXTURE_CHAIR_ID);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
    expect(result.config).toBeNull();
  });
});
