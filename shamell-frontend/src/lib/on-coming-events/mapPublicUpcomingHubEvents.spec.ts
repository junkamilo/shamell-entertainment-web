import { describe, expect, it } from "vitest";
import { makeUpcomingEventApiItem } from "./test/fixtures/onComingEventsLib.fixture";
import { FIXTURE_EVENT_SLUG } from "./test/fixtures/uuids.fixture";
import { mapPublicUpcomingHubEvents } from "./mapPublicUpcomingHubEvents";

describe("mapPublicUpcomingHubEvents", () => {
  it("returns empty for non-arrays and invalid rows", () => {
    expect(mapPublicUpcomingHubEvents(null)).toEqual([]);
    expect(mapPublicUpcomingHubEvents({})).toEqual([]);
    expect(
      mapPublicUpcomingHubEvents([
        { id: "x" },
        makeUpcomingEventApiItem({ items: [] }),
        makeUpcomingEventApiItem({ slug: "" }),
        makeUpcomingEventApiItem({ slug: "   " }),
      ]),
    ).toEqual([]);
  });

  it("maps a valid venue seating hub card by slug", () => {
    const [card] = mapPublicUpcomingHubEvents([makeUpcomingEventApiItem()]);
    expect(card).toEqual(
      expect.objectContaining({
        slug: FIXTURE_EVENT_SLUG,
        eventTypeName: "Gala Night",
        heroImageUrl: "https://cdn.example.com/oce/event.jpg",
        heroMediaType: "IMAGE",
        experienceType: "VENUE_SEATING",
        purchaseMode: "venue_seating",
        purchasable: true,
        fixedTicketCapacity: 100,
        ticketsSold: 10,
        ticketsRemaining: 90,
        eventStartsAt: "2030-08-01T00:00:00.000Z",
      }),
    );
    expect(card).not.toHaveProperty("id");
  });

  it("infers purchaseMode from experienceType when mode is missing", () => {
    const [classesCard] = mapPublicUpcomingHubEvents([
      makeUpcomingEventApiItem({
        purchaseMode: undefined,
        experienceType: "CLASSES",
        slug: "class-night",
      }),
    ]);
    expect(classesCard?.purchaseMode).toBe("classes");
    expect(classesCard?.experienceType).toBe("CLASSES");

    const [noneCard] = mapPublicUpcomingHubEvents([
      makeUpcomingEventApiItem({
        purchaseMode: "weird",
        experienceType: "OTHER",
        slug: "other-night",
      }),
    ]);
    expect(noneCard?.purchaseMode).toBe("none");
    expect(noneCard?.experienceType).toBeNull();
  });

  it("falls back hero from images and detects VIDEO media", () => {
    const [card] = mapPublicUpcomingHubEvents([
      makeUpcomingEventApiItem({
        heroImageUrl: null,
        heroMediaType: null,
        images: ["https://cdn.example.com/oce/clip.mp4"],
        slug: "video-night",
      }),
    ]);
    expect(card?.heroImageUrl).toBe("https://cdn.example.com/oce/clip.mp4");
    expect(card?.heroMediaType).toBe("VIDEO");
  });

  it("honors explicit VIDEO heroMediaType", () => {
    const [card] = mapPublicUpcomingHubEvents([
      makeUpcomingEventApiItem({
        heroMediaType: "video",
        slug: "explicit-video",
      }),
    ]);
    expect(card?.heroMediaType).toBe("VIDEO");
  });

  it("includes optional table inventory fields when parseable", () => {
    const [card] = mapPublicUpcomingHubEvents([
      makeUpcomingEventApiItem({
        tableCapacity: "20",
        tablesSold: 5,
        tablesRemaining: "15",
        slug: "tables-night",
      }),
    ]);
    expect(card).toEqual(
      expect.objectContaining({
        tableCapacity: 20,
        tablesSold: 5,
        tablesRemaining: 15,
      }),
    );
  });
});
