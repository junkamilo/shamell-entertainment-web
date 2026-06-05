import {
  buildDaySectionOffers,
  formatSeatAvailability,
  sessionDateIso,
  sumSelectedOfferPrices,
} from "./buildDaySectionOffers";
import type { ClassSessionPublic } from "../services/fetchUpcomingClassSessions";

function session(partial: Partial<ClassSessionPublic> & { id: string }): ClassSessionPublic {
  return {
    startsAt: "2026-06-04T22:00:00.000Z",
    endsAt: "2026-06-04T23:00:00.000Z",
    timezone: "America/New_York",
    capacity: 20,
    price: 20,
    currency: "usd",
    seatsRemaining: 5,
    weekday: 4,
    sectionId: "sec-1",
    sectionLabel: "Morning",
    sectionStartTime: "18:00",
    sectionEndTime: "19:00",
    ...partial,
  };
}

describe("sessionDateIso", () => {
  it("formats session start in session timezone", () => {
    const iso = sessionDateIso(
      { startsAt: "2026-06-04T22:00:00.000Z", timezone: "America/New_York" },
      "UTC",
    );
    expect(iso).toBe("2026-06-04");
  });
});

describe("buildDaySectionOffers", () => {
  const sections = [
    {
      id: "sec-1",
      label: "Section A",
      startTime: "18:00",
      endTime: "19:00",
      sortOrder: 0,
    },
    {
      id: "sec-2",
      label: "Section B",
      startTime: "20:00",
      endTime: "21:00",
      sortOrder: 1,
    },
  ];

  it("maps sections to sessions on the given date", () => {
    const offers = buildDaySectionOffers({
      dateIso: "2026-06-04",
      weekday: 4,
      sections,
      timezone: "America/New_York",
      sessions: [
        session({ id: "s1", sectionId: "sec-1", price: 25 }),
        session({
          id: "s2",
          sectionId: "sec-2",
          startsAt: "2026-06-05T14:00:00.000Z",
          endsAt: "2026-06-05T15:00:00.000Z",
          price: 30,
        }),
      ],
    });
    expect(offers).toHaveLength(2);
    expect(offers[0]?.available).toBe(true);
    expect(offers[0]?.price).toBe(25);
    expect(offers[1]?.available).toBe(false);
    expect(offers[1]?.sessionId).toBeNull();
  });

  it("marks unavailable when session is full", () => {
    const offers = buildDaySectionOffers({
      dateIso: "2026-06-04",
      weekday: 4,
      sections: [sections[0]!],
      timezone: "America/New_York",
      sessions: [session({ id: "s1", seatsRemaining: 0 })],
    });
    expect(offers[0]?.available).toBe(false);
  });

  it("falls back to legacy sessions when no sections configured", () => {
    const offers = buildDaySectionOffers({
      dateIso: "2026-06-04",
      weekday: 4,
      sections: [],
      timezone: "America/New_York",
      sessions: [session({ id: "s1", sectionId: null, sectionLabel: "Legacy" })],
    });
    expect(offers).toHaveLength(1);
    expect(offers[0]?.label).toBe("Legacy");
    expect(offers[0]?.available).toBe(true);
  });
});

describe("formatSeatAvailability", () => {
  it("describes none sold yet", () => {
    expect(formatSeatAvailability(20, 20)).toBe(
      "20 spots total · none sold yet · 20 available",
    );
  });

  it("describes partial sales", () => {
    expect(formatSeatAvailability(20, 10)).toBe(
      "20 spots total · 10 sold · 10 available",
    );
  });

  it("describes sold out", () => {
    expect(formatSeatAvailability(20, 0)).toBe(
      "20 spots total · 20 sold · sold out",
    );
  });
});

describe("sumSelectedOfferPrices", () => {
  it("sums prices for selected session ids", () => {
    const offers = buildDaySectionOffers({
      dateIso: "2026-06-04",
      weekday: 4,
      sections: [
        { id: "sec-1", label: "A", startTime: "18:00", endTime: "19:00", sortOrder: 0 },
      ],
      timezone: "America/New_York",
      sessions: [session({ id: "s1", sectionId: "sec-1", price: 40 })],
    });
    const total = sumSelectedOfferPrices(offers, new Set(["s1"]));
    expect(total).toBe(40);
  });
});
