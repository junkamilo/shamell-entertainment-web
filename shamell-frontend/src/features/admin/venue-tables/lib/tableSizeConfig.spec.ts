import { describe, expect, it } from "vitest";
import {
  clampChairsForSize,
  formatVenueTableAdminSubtitle,
  formatVenueTableDisplayLabel,
  TABLE_SIZE_CONFIG,
  TABLE_SIZE_ORDER,
} from "./tableSizeConfig";
import { FIXTURE_TABLE_ID } from "../test/fixtures/uuids.fixture";

describe("tableSizeConfig", () => {
  it("defines config for all sizes in order", () => {
    expect(TABLE_SIZE_ORDER).toEqual(["LARGE", "MEDIUM", "SMALL"]);
    expect(TABLE_SIZE_CONFIG.LARGE.defaultChairs).toBe(6);
    expect(TABLE_SIZE_CONFIG.SMALL.maxChairs).toBe(4);
  });

  it("clamps chairs within size limits", () => {
    expect(clampChairsForSize("LARGE", 20)).toBe(8);
    expect(clampChairsForSize("LARGE", 1)).toBe(4);
    expect(clampChairsForSize("SMALL", 3)).toBe(3);
  });

  it("returns default chairs for non-finite input", () => {
    expect(clampChairsForSize("MEDIUM", NaN)).toBe(TABLE_SIZE_CONFIG.MEDIUM.defaultChairs);
  });

  it("formatVenueTableDisplayLabel prefers displayLabel", () => {
    expect(formatVenueTableDisplayLabel({ size: "LARGE", displayLabel: " VIP " })).toBe("VIP");
    expect(formatVenueTableDisplayLabel({ size: "MEDIUM" })).toBe("Medium");
  });

  it("formatVenueTableAdminSubtitle includes chairs, price, and short id", () => {
    expect(
      formatVenueTableAdminSubtitle({
        id: FIXTURE_TABLE_ID,
        includedChairs: 8,
        bundlePrice: 250,
      }),
    ).toBe("8 chairs · $250 · #vt1111");
  });
});
