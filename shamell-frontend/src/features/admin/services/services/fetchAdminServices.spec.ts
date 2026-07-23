import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchAdminServices } from "./fetchAdminServices";
import { FIXTURE_SERVICE_ID } from "../test/fixtures/uuids.fixture";

describe("fetchAdminServices", () => {
  it("loads the services list", async () => {
    const result = await fetchAdminServices("token-1");
    expect(result[0]?.id).toBe(FIXTURE_SERVICE_ID);
    expect(result.length).toBeGreaterThan(0);
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.get("*/api/v1/services/admin", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(fetchAdminServices("token-1")).rejects.toThrow(/nope/);
  });
});
