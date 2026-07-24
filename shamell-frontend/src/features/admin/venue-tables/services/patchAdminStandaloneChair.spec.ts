import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { patchAdminStandaloneChair } from "./patchAdminStandaloneChair";
import { FIXTURE_CHAIR_CONFIG_ID, FIXTURE_CHAIR_ID } from "../test/fixtures/uuids.fixture";

describe("patchAdminStandaloneChair", () => {
  it("returns mapped config on success", async () => {
    const result = await patchAdminStandaloneChair("token-1", FIXTURE_CHAIR_ID, 42);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.config?.id).toBe(FIXTURE_CHAIR_CONFIG_ID);
  });

  it("sends unitPrice JSON with bearer token", async () => {
    let auth: string | null = null;
    let received: unknown = null;
    server.use(
      http.patch("*/api/v1/standalone-chairs/admin/:id", async ({ request }) => {
        auth = request.headers.get("Authorization");
        received = await request.json();
        return HttpResponse.json({ id: FIXTURE_CHAIR_CONFIG_ID, unitPrice: 42 });
      }),
    );
    await patchAdminStandaloneChair("token-1", FIXTURE_CHAIR_ID, 42);
    expect(auth).toBe("Bearer token-1");
    expect(received).toEqual({ unitPrice: 42 });
  });

  it("returns null config on error", async () => {
    server.use(
      http.patch("*/api/v1/standalone-chairs/admin/:id", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    const result = await patchAdminStandaloneChair("token-1", FIXTURE_CHAIR_ID, 42);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
    expect(result.config).toBeNull();
  });
});
