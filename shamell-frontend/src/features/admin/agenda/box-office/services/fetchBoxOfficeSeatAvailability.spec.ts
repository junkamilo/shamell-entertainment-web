import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/server";
import { FIXTURE_VENUE_EVENT_ID } from "../test/fixtures/uuids.fixture";
import { fetchBoxOfficeSeatAvailability } from "./fetchBoxOfficeSeatAvailability";

const ROUTE = "*/api/v1/venue-reservations/admin/availability";

describe("fetchBoxOfficeSeatAvailability", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns ok data mapped from the availability payload", async () => {
    const result = await fetchBoxOfficeSeatAvailability("token-1", {
      upcomingEventId: FIXTURE_VENUE_EVENT_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
        upcomingEventId: FIXTURE_VENUE_EVENT_ID,
        upcomingEventSlug: "gala-night",
        eventDate: "2030-08-01",
        reservedLayoutItemIds: [],
        reservedVenueTableConfigIds: [],
        reservedSeatShortLabels: [],
        pendingLayoutItemIds: [],
        paidSeatHolders: [],
      });
    }
  });

  it("includes upcomingEventId and upcomingEventSlug in the query string", async () => {
    let requestedUrl = "";
    server.use(
      http.get(ROUTE, ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json({
          upcomingEventId: FIXTURE_VENUE_EVENT_ID,
          upcomingEventSlug: "gala-night",
          eventDate: "2030-08-01",
          reservedLayoutItemIds: ["li_table_1"],
          reservedVenueTableConfigIds: ["vtc_1"],
          reservedSeatShortLabels: ["Large 1"],
          pendingLayoutItemIds: ["li_chair_1"],
          paidSeatHolders: [
            { layoutItemId: "li_table_1", customerName: "Ada" },
          ],
        });
      }),
    );

    const result = await fetchBoxOfficeSeatAvailability("token-1", {
      upcomingEventId: FIXTURE_VENUE_EVENT_ID,
      upcomingEventSlug: "gala-night",
    });

    expect(requestedUrl).toContain(`upcomingEventId=${FIXTURE_VENUE_EVENT_ID}`);
    expect(requestedUrl).toContain("upcomingEventSlug=gala-night");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.reservedLayoutItemIds).toEqual(["li_table_1"]);
      expect(result.data.paidSeatHolders).toEqual([
        { layoutItemId: "li_table_1", customerName: "Ada" },
      ]);
    }
  });

  it("returns ok:false with a generic message on a bad response", async () => {
    server.use(http.get(ROUTE, () => HttpResponse.json({}, { status: 500 })));

    const result = await fetchBoxOfficeSeatAvailability("token-1", {
      upcomingEventId: FIXTURE_VENUE_EVENT_ID,
    });
    expect(result).toEqual({
      ok: false,
      message: "Could not load seat availability.",
    });
  });

  it("returns ok:false when fetch is offline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    const result = await fetchBoxOfficeSeatAvailability("token-1", {
      upcomingEventId: FIXTURE_VENUE_EVENT_ID,
    });
    expect(result).toEqual({
      ok: false,
      message: "Could not reach the server.",
    });
  });
});
