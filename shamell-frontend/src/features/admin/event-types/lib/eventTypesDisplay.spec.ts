import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildEventTypeSubtitle,
  buildEventTypeUsageLine,
  formatRelativeEn,
  iconIndexForTypeName,
} from "./eventTypesDisplay";
import { TYPE_ICONS } from "./eventTypesConstants";
import { FIXTURE_OCCASION_ID } from "../test/fixtures/uuids.fixture";

describe("eventTypesDisplay", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("iconIndexForTypeName", () => {
    it("returns a number within TYPE_ICONS bounds", () => {
      const index = iconIndexForTypeName("Private weddings");
      expect(typeof index).toBe("number");
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(TYPE_ICONS.length);
    });
  });

  describe("formatRelativeEn", () => {
    it("returns an em dash for missing or invalid dates", () => {
      expect(formatRelativeEn(undefined)).toBe("—");
      expect(formatRelativeEn("not-a-date")).toBe("—");
    });

    it("formats recent times relative to now", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-07-23T12:00:00.000Z"));
      expect(formatRelativeEn("2026-07-23T11:59:30.000Z")).toBe("Just now");
      expect(formatRelativeEn("2026-07-23T11:50:00.000Z")).toBe("10 min ago");
      expect(formatRelativeEn("2026-07-23T10:00:00.000Z")).toBe("2h ago");
      expect(formatRelativeEn("2026-07-21T12:00:00.000Z")).toBe("2d ago");
    });
  });

  describe("buildEventTypeUsageLine", () => {
    it("summarizes catalog events alone", () => {
      expect(buildEventTypeUsageLine({})).toBe("0 catalog events");
      expect(buildEventTypeUsageLine({ eventCount: 1 })).toBe("1 catalog event");
    });

    it("appends bookings and gallery photos when present", () => {
      expect(
        buildEventTypeUsageLine({
          eventCount: 2,
          bookingCount: 1,
          galleryPhotoCount: 3,
        }),
      ).toBe("2 catalog events · 1 booking · 3 gallery photos");
    });
  });

  describe("buildEventTypeSubtitle", () => {
    it("returns the empty-links message when unused", () => {
      expect(buildEventTypeSubtitle({})).toBe("No linked catalog events or occasions.");
    });

    it("mentions occasions when only occasions are linked", () => {
      expect(
        buildEventTypeSubtitle({
          occasionAssignments: [{ occasionTypeId: FIXTURE_OCCASION_ID, occasionName: "Birthday" }],
        }),
      ).toBe("1 occasion type linked as contact options.");
    });

    it("blocks deactivate/delete copy when usage exists", () => {
      expect(
        buildEventTypeSubtitle({
          eventCount: 1,
          occasionAssignments: [{ occasionTypeId: FIXTURE_OCCASION_ID }],
        }),
      ).toContain("Deactivate and delete are blocked");
    });
  });
});
