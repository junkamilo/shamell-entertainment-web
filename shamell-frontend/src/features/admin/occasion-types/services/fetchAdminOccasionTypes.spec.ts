import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchAdminOccasionTypes } from "./fetchAdminOccasionTypes";
import { FIXTURE_OCCASION_TYPE_ID } from "../test/fixtures/uuids.fixture";
import { occasionTypesListHandler } from "../test/mocks/handlers";

describe("fetchAdminOccasionTypes", () => {
  it("loads the occasion types list", async () => {
    server.use(occasionTypesListHandler());
    const result = await fetchAdminOccasionTypes("token-1");
    expect(result[0]?.id).toBe(FIXTURE_OCCASION_TYPE_ID);
    expect(result.length).toBeGreaterThan(0);
  });

  it("sends bearer token", async () => {
    let auth: string | null = null;
    server.use(
      http.get("*/api/v1/events/occasions/admin", ({ request }) => {
        auth = request.headers.get("Authorization");
        return HttpResponse.json([]);
      }),
    );
    await fetchAdminOccasionTypes("token-1");
    expect(auth).toBe("Bearer token-1");
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.get("*/api/v1/events/occasions/admin", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(fetchAdminOccasionTypes("token-1")).rejects.toThrow(/nope/);
  });
});
