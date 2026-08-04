import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  fetchVenueReservationAvailability,
  salesClosedMessage,
} from "./fetchVenueReservationAvailability";
import { FIXTURE_EVENT_SLUG, FIXTURE_LAYOUT_ITEM_ID } from "../test/fixtures/uuids.fixture";
import { makeVenueAvailability } from "../test/fixtures/onComingEvents.fixture";

describe("fetchVenueReservationAvailability", () => {
  it("loads availability with reservations open", async () => {
    const availability = await fetchVenueReservationAvailability(FIXTURE_EVENT_SLUG);
    expect(availability.reservationsOpen).toBe(true);
    expect(availability.eventDate).toBe("2030-08-01");
    expect(availability.salesClosedReason).toBeNull();
  });

  it("passes upcomingEventSlug query param", async () => {
    let url = "";
    server.use(
      http.get("*/api/v1/venue-reservations/availability", ({ request }) => {
        url = request.url;
        return HttpResponse.json(makeVenueAvailability());
      }),
    );
    await fetchVenueReservationAvailability(FIXTURE_EVENT_SLUG);
    expect(url).toContain(`upcomingEventSlug=${FIXTURE_EVENT_SLUG}`);
  });

  it("returns empty availability on non-ok response", async () => {
    server.use(
      http.get("*/api/v1/venue-reservations/availability", () =>
        HttpResponse.json({ message: "down" }, { status: 500 }),
      ),
    );
    const availability = await fetchVenueReservationAvailability();
    expect(availability.reservationsOpen).toBe(false);
    expect(availability.salesClosedReason).toBe("not_configured");
  });

  it("filters invalid paid seat holders and trims names", async () => {
    server.use(
      http.get("*/api/v1/venue-reservations/availability", () =>
        HttpResponse.json(
          makeVenueAvailability({
            paidSeatHolders: [
              { layoutItemId: FIXTURE_LAYOUT_ITEM_ID, customerName: "  Ada  " },
              { layoutItemId: 123, customerName: "bad" },
              null,
            ] as unknown as { layoutItemId: string; customerName: string }[],
          }),
        ),
      ),
    );
    const availability = await fetchVenueReservationAvailability();
    expect(availability.paidSeatHolders).toEqual([
      { layoutItemId: FIXTURE_LAYOUT_ITEM_ID, customerName: "Ada" },
    ]);
  });

  it("ignores unknown salesClosedReason values", async () => {
    server.use(
      http.get("*/api/v1/venue-reservations/availability", () =>
        HttpResponse.json(
          makeVenueAvailability({
            salesClosedReason: "unknown" as "not_configured",
          }),
        ),
      ),
    );
    const availability = await fetchVenueReservationAvailability();
    expect(availability.salesClosedReason).toBeNull();
  });
});

describe("salesClosedMessage", () => {
  it("maps each reason to a user-facing message", () => {
    expect(salesClosedMessage("not_started")).toBe("Reservations are not open yet.");
    expect(salesClosedMessage("ended")).toBe("Reservations have closed.");
    expect(salesClosedMessage("sold_out")).toBe("All seats are sold.");
    expect(salesClosedMessage("not_configured")).toBe("Reservations are not available.");
  });

  it("returns generic message for null or unknown reason", () => {
    expect(salesClosedMessage(null)).toBe("Reservations are closed.");
  });
});
