import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchAdminVenueAvailability } from "./fetchAdminVenueAvailability";
import { venueAvailabilityHandler } from "../../test/mocks/handlers";
import {
  FIXTURE_EVENT_ID,
  FIXTURE_LAYOUT_ITEM_ID,
} from "../../test/fixtures/uuids.fixture";

describe("fetchAdminVenueAvailability", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads availability on success", async () => {
    server.use(venueAvailabilityHandler());
    const result = await fetchAdminVenueAvailability("token-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.upcomingEventId).toBe(FIXTURE_EVENT_ID);
      expect(result.data.reservedLayoutItemIds).toContain(FIXTURE_LAYOUT_ITEM_ID);
    }
  });

  it("forwards upcomingEventSlug query param", async () => {
    let url = "";
    server.use(
      http.get("*/api/v1/venue-reservations/admin/availability", ({ request }) => {
        url = request.url;
        return HttpResponse.json({});
      }),
    );
    await fetchAdminVenueAvailability("token-1", {
      upcomingEventSlug: "gala-night",
    });
    expect(url).toContain("upcomingEventSlug=gala-night");
  });

  it("returns ok:false when API fails", async () => {
    server.use(
      http.get("*/api/v1/venue-reservations/admin/availability", () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );
    const result = await fetchAdminVenueAvailability("token-1");
    expect(result).toEqual({ ok: false, message: "Could not load availability." });
  });

  it("returns ok:false when offline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const result = await fetchAdminVenueAvailability("token-1");
    expect(result).toEqual({ ok: false, message: "Could not reach the server." });
  });
});
