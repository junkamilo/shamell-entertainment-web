import { describe, expect, it } from "vitest";
import { makeOccasionTypeItem } from "../test/fixtures/occasionTypes.fixture";
import {
  canDeleteOccasionType,
  cannotDeactivateWhileActive,
  getDeactivateBlockedDescription,
  getDeleteBlockedDescription,
} from "./occasionTypesUsage";

describe("occasionTypesUsage", () => {
  it("canDeleteOccasionType requires zero bookings", () => {
    expect(canDeleteOccasionType(makeOccasionTypeItem())).toBe(true);
    expect(canDeleteOccasionType(makeOccasionTypeItem({ bookingCount: 1 }))).toBe(
      false,
    );
  });

  it("cannotDeactivateWhileActive when active with bookings", () => {
    expect(
      cannotDeactivateWhileActive(
        makeOccasionTypeItem({ isActive: true, bookingCount: 1 }),
      ),
    ).toBe(true);
    expect(
      cannotDeactivateWhileActive(
        makeOccasionTypeItem({ isActive: false, bookingCount: 1 }),
      ),
    ).toBe(false);
    expect(cannotDeactivateWhileActive(makeOccasionTypeItem())).toBe(false);
  });

  it("builds deactivate and delete blocked descriptions", () => {
    expect(
      getDeactivateBlockedDescription(makeOccasionTypeItem({ bookingCount: 1 })),
    ).toContain("1 linked booking");
    expect(
      getDeactivateBlockedDescription(makeOccasionTypeItem({ bookingCount: 3 })),
    ).toContain("3 linked bookings");
    expect(
      getDeleteBlockedDescription(makeOccasionTypeItem({ bookingCount: 1 })),
    ).toContain("before you can delete it");
    expect(
      getDeleteBlockedDescription(makeOccasionTypeItem({ bookingCount: 2 })),
    ).toContain("2 linked bookings");
  });
});
