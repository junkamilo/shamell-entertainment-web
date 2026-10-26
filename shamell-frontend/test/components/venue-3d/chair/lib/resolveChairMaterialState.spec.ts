import { describe, expect, it } from "vitest";
import { CHAIR_COLORS } from "@/components/venue-3d/chair/lib/chairConstants";
import { resolveChairMaterialState } from "@/components/venue-3d/chair/lib/resolveChairMaterialState";

describe("resolveChairMaterialState", () => {
  it("prioritizes reserved over selected", () => {
    expect(resolveChairMaterialState(true, true)).toEqual({
      velvet: CHAIR_COLORS.velvetReserved,
      frame: CHAIR_COLORS.frameReserved,
      emissiveIntensity: 0,
    });
  });

  it("uses highlight when selected", () => {
    expect(resolveChairMaterialState(true, false).velvet).toBe(
      CHAIR_COLORS.velvetHighlight,
    );
    expect(resolveChairMaterialState(true, false).emissiveIntensity).toBe(0.15);
  });

  it("uses default available colors", () => {
    expect(resolveChairMaterialState(false, false)).toEqual({
      velvet: CHAIR_COLORS.velvet,
      frame: CHAIR_COLORS.frame,
      emissiveIntensity: 0,
    });
  });
});
