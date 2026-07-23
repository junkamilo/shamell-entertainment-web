import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchAdminOccasionsCatalog } from "./fetchAdminOccasionsCatalog";
import { FIXTURE_OCCASION_ID } from "../test/fixtures/uuids.fixture";

describe("fetchAdminOccasionsCatalog", () => {
  it("loads the occasions catalog", async () => {
    const result = await fetchAdminOccasionsCatalog("token-1");
    expect(result[0]?.id).toBe(FIXTURE_OCCASION_ID);
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns [] on 500", async () => {
    server.use(
      http.get("*/api/v1/events/occasions/admin", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(fetchAdminOccasionsCatalog("token-1")).resolves.toEqual([]);
  });
});
