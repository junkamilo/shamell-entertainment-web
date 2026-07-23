import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchAdminPeticiones } from "./fetchAdminPeticiones";
import { FIXTURE_CONTACT_ID } from "../test/fixtures/uuids.fixture";

describe("fetchAdminPeticiones", () => {
  it("loads a paginated peticiones list", async () => {
    const result = await fetchAdminPeticiones("token-1", {
      page: 1,
      perPage: 10,
      lane: "bookings",
    });
    expect(result.items[0]?.id).toBe(FIXTURE_CONTACT_ID);
    expect(result.meta.page).toBe(1);
    expect(result.meta.totalItems).toBeGreaterThan(0);
  });

  it("throws when the request fails", async () => {
    server.use(
      http.get("*/api/v1/contact/peticiones", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(fetchAdminPeticiones("token-1")).rejects.toThrow(/nope/);
  });
});
