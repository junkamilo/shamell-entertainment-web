import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchVenueSessionStatus } from "./fetchVenueSessionStatus";
import {
  FIXTURE_LAYOUT_ITEM_ID,
  FIXTURE_RESERVATION_ID,
} from "../test/fixtures/uuids.fixture";
import { makeVenueSessionStatus } from "../test/fixtures/onComingEvents.fixture";

describe("fetchVenueSessionStatus", () => {
  it("loads session status with reservation details", async () => {
    const status = await fetchVenueSessionStatus("cs_test_session");
    expect(status?.stripeStatus).toBe("complete");
    expect(status?.reservation.id).toBe(FIXTURE_RESERVATION_ID);
    expect(status?.reservation.layoutItemId).toBe(FIXTURE_LAYOUT_ITEM_ID);
  });

  it("passes session_id query param", async () => {
    let url = "";
    server.use(
      http.get("*/api/v1/venue-reservations/session-status", ({ request }) => {
        url = request.url;
        return HttpResponse.json(makeVenueSessionStatus());
      }),
    );
    await fetchVenueSessionStatus("cs_test_abc");
    expect(url).toContain("session_id=cs_test_abc");
  });

  it("returns null on non-ok response", async () => {
    server.use(
      http.get("*/api/v1/venue-reservations/session-status", () =>
        HttpResponse.json({ message: "missing" }, { status: 404 }),
      ),
    );
    await expect(fetchVenueSessionStatus("cs_missing")).resolves.toBeNull();
  });

  it("returns null when reservation is missing", async () => {
    server.use(
      http.get("*/api/v1/venue-reservations/session-status", () =>
        HttpResponse.json({ stripeStatus: "complete" }),
      ),
    );
    await expect(fetchVenueSessionStatus("cs_test")).resolves.toBeNull();
  });
});
