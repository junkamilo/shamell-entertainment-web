import { describe, expect, it } from "vitest";
import type { VenueLayoutPageCacheEntry } from "./venueLayoutPageCache";
import {
  getVenueLayoutPageCache,
  patchVenueLayoutPageAvailability,
  setVenueLayoutPageCache,
} from "./venueLayoutPageCache";
import { FIXTURE_EVENT_SLUG, FIXTURE_LAYOUT_ITEM_ID } from "../test/fixtures/uuids.fixture";
import { makeFloorLayoutApiPayload } from "../test/fixtures/onComingEvents.fixture";
import { mapFloorLayoutFromApi } from "@/features/admin/on-coming-events/layout/lib/mapFloorLayoutFromApi";

function makeCacheEntry(
  overrides: Partial<VenueLayoutPageCacheEntry> = {},
): VenueLayoutPageCacheEntry {
  return {
    layout: mapFloorLayoutFromApi(makeFloorLayoutApiPayload())!,
    tables: [],
    standaloneChairs: {
      id: null,
      availableQuantity: 0,
      unitPrice: 0,
      updatedAt: null,
      isDefault: true,
      reservedCount: 0,
      totalCount: 0,
      chairs: [],
    },
    clientEnabled: true,
    eventLabel: "Saturday Gala",
    eventTitle: "Saturday Gala",
    eventDescription: "Venue seating night.",
    eventItems: ["Tables"],
    heroImageUrl: null,
    heroMediaType: null,
    eventPrice: null,
    eventDateIso: "2030-08-01",
    reservationsOpen: true,
    salesClosedReason: null,
    reservedLayoutItemIds: [],
    reservedVenueTableConfigIds: [],
    reservedSeatShortLabels: [],
    paidSeatHolders: [],
    ...overrides,
  };
}

describe("venueLayoutPageCache", () => {
  it("stores and retrieves cache by event slug", () => {
    const entry = makeCacheEntry();
    setVenueLayoutPageCache(FIXTURE_EVENT_SLUG, entry);
    expect(getVenueLayoutPageCache(FIXTURE_EVENT_SLUG)).toEqual(entry);
  });

  it("uses legacy key when slug is omitted", () => {
    const entry = makeCacheEntry({ eventTitle: "Legacy event" });
    setVenueLayoutPageCache(undefined, entry);
    expect(getVenueLayoutPageCache()).toEqual(entry);
    expect(getVenueLayoutPageCache(undefined)).toEqual(entry);
  });

  it("patches availability fields on existing entry", () => {
    const entry = makeCacheEntry();
    setVenueLayoutPageCache(FIXTURE_EVENT_SLUG, entry);
    patchVenueLayoutPageAvailability(FIXTURE_EVENT_SLUG, {
      reservedLayoutItemIds: [FIXTURE_LAYOUT_ITEM_ID],
      reservedVenueTableConfigIds: [],
      reservedSeatShortLabels: ["A1"],
      paidSeatHolders: [{ layoutItemId: FIXTURE_LAYOUT_ITEM_ID, customerName: "Ada" }],
      reservationsOpen: false,
      salesClosedReason: "sold_out",
      eventDateIso: "2030-08-01",
    });
    const cached = getVenueLayoutPageCache(FIXTURE_EVENT_SLUG);
    expect(cached?.reservationsOpen).toBe(false);
    expect(cached?.salesClosedReason).toBe("sold_out");
    expect(cached?.reservedLayoutItemIds).toEqual([FIXTURE_LAYOUT_ITEM_ID]);
  });

  it("no-ops patch when cache entry is missing", () => {
    patchVenueLayoutPageAvailability("missing-slug", {
      reservedLayoutItemIds: [FIXTURE_LAYOUT_ITEM_ID],
      reservedVenueTableConfigIds: [],
      reservedSeatShortLabels: [],
      paidSeatHolders: [],
      reservationsOpen: false,
      salesClosedReason: "ended",
      eventDateIso: null,
    });
    expect(getVenueLayoutPageCache("missing-slug")).toBeNull();
  });
});
