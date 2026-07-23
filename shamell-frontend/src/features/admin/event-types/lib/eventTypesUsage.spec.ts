import { describe, expect, it } from "vitest";
import { makeEventTypeItem } from "../test/fixtures/eventTypes.fixture";
import {
  canDeleteEventType,
  cannotDeactivateWhileActive,
  getDeactivateBlockedDescription,
  getDeleteBlockedDescription,
  hasBlockingUsage,
} from "./eventTypesUsage";

describe("eventTypesUsage", () => {
  describe("hasBlockingUsage", () => {
    it("is false when all counts are zero", () => {
      expect(hasBlockingUsage(makeEventTypeItem())).toBe(false);
    });

    it("is true when any usage count is positive", () => {
      expect(hasBlockingUsage(makeEventTypeItem({ eventCount: 1 }))).toBe(true);
      expect(hasBlockingUsage(makeEventTypeItem({ bookingCount: 2 }))).toBe(true);
      expect(hasBlockingUsage(makeEventTypeItem({ galleryPhotoCount: 1 }))).toBe(true);
    });
  });

  describe("canDeleteEventType", () => {
    it("allows delete when there is no blocking usage", () => {
      expect(canDeleteEventType(makeEventTypeItem())).toBe(true);
    });

    it("blocks delete when usage exists", () => {
      expect(canDeleteEventType(makeEventTypeItem({ eventCount: 1 }))).toBe(false);
    });
  });

  describe("cannotDeactivateWhileActive", () => {
    it("is true only when active and linked", () => {
      expect(
        cannotDeactivateWhileActive(makeEventTypeItem({ isActive: true, bookingCount: 1 })),
      ).toBe(true);
      expect(
        cannotDeactivateWhileActive(makeEventTypeItem({ isActive: true, bookingCount: 0 })),
      ).toBe(false);
      expect(
        cannotDeactivateWhileActive(makeEventTypeItem({ isActive: false, bookingCount: 3 })),
      ).toBe(false);
    });
  });

  describe("getDeactivateBlockedDescription", () => {
    it("describes singular and combined links", () => {
      expect(getDeactivateBlockedDescription(makeEventTypeItem({ eventCount: 1 }))).toBe(
        "This event type has 1 catalog event linked. Remove or reassign those records before you can turn this type off.",
      );
      expect(
        getDeactivateBlockedDescription(
          makeEventTypeItem({ eventCount: 2, bookingCount: 1, galleryPhotoCount: 3 }),
        ),
      ).toBe(
        "This event type has 2 catalog events, 1 booking, and 3 gallery photos linked. Remove or reassign those records before you can turn this type off.",
      );
    });
  });

  describe("getDeleteBlockedDescription", () => {
    it("describes two-part and singular links", () => {
      expect(
        getDeleteBlockedDescription(makeEventTypeItem({ bookingCount: 1, galleryPhotoCount: 2 })),
      ).toBe(
        "This event type has 1 booking and 2 gallery photos linked. Remove or reassign those records before you can delete it.",
      );
      expect(getDeleteBlockedDescription(makeEventTypeItem({ galleryPhotoCount: 1 }))).toBe(
        "This event type has 1 gallery photo linked. Remove or reassign those records before you can delete it.",
      );
    });
  });
});
