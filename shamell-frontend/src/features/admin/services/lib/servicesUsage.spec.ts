import { describe, expect, it } from "vitest";
import { makeAdminService } from "../test/fixtures/services.fixture";
import {
  canDeleteService,
  cannotDeactivateWhileActive,
  getDeactivateBlockedDescription,
  getDeleteBlockedDescription,
  getDeleteBlockedTitle,
} from "./servicesUsage";

describe("servicesUsage", () => {
  describe("canDeleteService", () => {
    it("allows delete when there are no linked bookings or gallery photos", () => {
      expect(canDeleteService(makeAdminService())).toBe(true);
    });

    it("blocks delete when bookings or gallery photos exist", () => {
      expect(canDeleteService(makeAdminService({ bookingCount: 1 }))).toBe(false);
      expect(canDeleteService(makeAdminService({ galleryPhotoCount: 2 }))).toBe(false);
    });
  });

  describe("cannotDeactivateWhileActive", () => {
    it("is true only when active and linked to bookings", () => {
      expect(
        cannotDeactivateWhileActive(makeAdminService({ isActive: true, bookingCount: 1 })),
      ).toBe(true);
      expect(
        cannotDeactivateWhileActive(makeAdminService({ isActive: true, bookingCount: 0 })),
      ).toBe(false);
      expect(
        cannotDeactivateWhileActive(makeAdminService({ isActive: false, bookingCount: 3 })),
      ).toBe(false);
    });
  });

  describe("getDeactivateBlockedDescription", () => {
    it("uses singular copy for one booking", () => {
      expect(getDeactivateBlockedDescription(makeAdminService({ bookingCount: 1 }))).toBe(
        "This service has 1 linked booking. Resolve or reassign that booking before you can turn this service off.",
      );
    });

    it("uses plural copy for multiple bookings", () => {
      expect(getDeactivateBlockedDescription(makeAdminService({ bookingCount: 3 }))).toBe(
        "This service has 3 linked bookings. Resolve or reassign those bookings before you can turn this service off.",
      );
    });
  });

  describe("getDeleteBlockedDescription", () => {
    it("covers bookings and gallery photos together", () => {
      expect(
        getDeleteBlockedDescription(
          makeAdminService({ bookingCount: 1, galleryPhotoCount: 2 }),
        ),
      ).toBe(
        "This service has 1 linked booking and 2 linked gallery photos. Remove those links before you can delete it.",
      );
    });

    it("covers bookings only (singular and plural)", () => {
      expect(getDeleteBlockedDescription(makeAdminService({ bookingCount: 1 }))).toBe(
        "This service has 1 linked booking. Resolve or remove that booking before you can delete this service.",
      );
      expect(getDeleteBlockedDescription(makeAdminService({ bookingCount: 2 }))).toBe(
        "This service has 2 linked bookings. Resolve or remove those bookings before you can delete this service.",
      );
    });

    it("covers gallery photos only (singular and plural)", () => {
      expect(getDeleteBlockedDescription(makeAdminService({ galleryPhotoCount: 1 }))).toBe(
        "This service has 1 linked gallery photo. Unlink or remove that photo before you can delete this service.",
      );
      expect(getDeleteBlockedDescription(makeAdminService({ galleryPhotoCount: 3 }))).toBe(
        "This service has 3 linked gallery photos. Unlink or remove those photos before you can delete this service.",
      );
    });

    it("returns a generic message when counts are zero", () => {
      expect(getDeleteBlockedDescription(makeAdminService())).toBe(
        "This service cannot be deleted while it still has linked records.",
      );
    });
  });

  describe("getDeleteBlockedTitle", () => {
    it("prefers bookings title when bookings exist", () => {
      expect(getDeleteBlockedTitle(makeAdminService({ bookingCount: 1 }))).toBe(
        "Has linked bookings",
      );
    });

    it("falls back to gallery photos title otherwise", () => {
      expect(getDeleteBlockedTitle(makeAdminService({ galleryPhotoCount: 1 }))).toBe(
        "Has linked gallery photos",
      );
    });
  });
});
