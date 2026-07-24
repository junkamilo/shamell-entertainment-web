import { describe, expect, it } from "vitest";
import { makeOccasionTypeItem } from "../test/fixtures/occasionTypes.fixture";
import { buildOccasionTypeSubtitle } from "./occasionTypesDisplay";

describe("buildOccasionTypeSubtitle", () => {
  it("describes unused types", () => {
    expect(buildOccasionTypeSubtitle(makeOccasionTypeItem())).toBe(
      "No linked event types or bookings.",
    );
  });

  it("describes linked event types without bookings", () => {
    expect(
      buildOccasionTypeSubtitle(makeOccasionTypeItem({ eventTypeLinkCount: 1 })),
    ).toContain("1 event type linked");
    expect(
      buildOccasionTypeSubtitle(makeOccasionTypeItem({ eventTypeLinkCount: 3 })),
    ).toContain("3 event types linked");
  });

  it("describes bookings and blocks deactivate/delete copy", () => {
    const one = buildOccasionTypeSubtitle(
      makeOccasionTypeItem({ bookingCount: 1, eventTypeLinkCount: 1 }),
    );
    expect(one).toContain("1 linked booking");
    expect(one).toContain("1 event type linked");
    expect(one).toContain("Deactivate and delete are blocked");

    const many = buildOccasionTypeSubtitle(
      makeOccasionTypeItem({ bookingCount: 2, eventTypeLinkCount: 0 }),
    );
    expect(many).toContain("2 linked bookings");
  });
});
