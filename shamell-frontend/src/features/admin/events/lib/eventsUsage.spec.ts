import { describe, expect, it } from "vitest";
import { makeAdminEvent } from "../test/fixtures/events.fixture";
import {
  canDeleteEvent,
  cannotDeactivateWhileActive,
  deleteBlockedReason,
  getDeactivateBlockedDescription,
  getDeleteBlockedDescription,
} from "./eventsUsage";

describe("eventsUsage", () => {
  describe("canDeleteEvent", () => {
    it("allows delete when there are no linked bookings", () => {
      expect(canDeleteEvent(makeAdminEvent())).toBe(true);
      expect(canDeleteEvent(makeAdminEvent({ galleryPhotoCount: 5 }))).toBe(true);
    });

    it("blocks delete when bookings exist", () => {
      expect(canDeleteEvent(makeAdminEvent({ bookingCount: 1 }))).toBe(false);
    });
  });

  describe("deleteBlockedReason", () => {
    it("returns null when delete is allowed", () => {
      expect(deleteBlockedReason(makeAdminEvent())).toBeNull();
    });

    it("returns the blocked description when bookings exist", () => {
      expect(deleteBlockedReason(makeAdminEvent({ bookingCount: 1 }))).toBe(
        getDeleteBlockedDescription(makeAdminEvent({ bookingCount: 1 })),
      );
    });
  });

  describe("cannotDeactivateWhileActive", () => {
    it("is true only when active and linked to bookings", () => {
      expect(
        cannotDeactivateWhileActive(makeAdminEvent({ isActive: true, bookingCount: 1 })),
      ).toBe(true);
      expect(
        cannotDeactivateWhileActive(makeAdminEvent({ isActive: true, bookingCount: 0 })),
      ).toBe(false);
      expect(
        cannotDeactivateWhileActive(makeAdminEvent({ isActive: false, bookingCount: 3 })),
      ).toBe(false);
    });
  });

  describe("getDeactivateBlockedDescription", () => {
    it("uses singular copy for one booking", () => {
      expect(getDeactivateBlockedDescription(makeAdminEvent({ bookingCount: 1 }))).toBe(
        "This event has 1 linked booking. Resolve or remove that booking before you can turn this event off.",
      );
    });

    it("uses plural copy for multiple bookings", () => {
      expect(getDeactivateBlockedDescription(makeAdminEvent({ bookingCount: 3 }))).toBe(
        "This event has 3 linked bookings. Resolve or remove those bookings before you can turn this event off.",
      );
    });
  });

  describe("getDeleteBlockedDescription", () => {
    it("uses singular copy for one booking", () => {
      expect(getDeleteBlockedDescription(makeAdminEvent({ bookingCount: 1 }))).toBe(
        "This event has 1 linked booking. Resolve or remove that booking before you can delete it.",
      );
    });

    it("uses plural copy for multiple bookings", () => {
      expect(getDeleteBlockedDescription(makeAdminEvent({ bookingCount: 2 }))).toBe(
        "This event has 2 linked bookings. Resolve or remove those bookings before you can delete it.",
      );
    });
  });
});
