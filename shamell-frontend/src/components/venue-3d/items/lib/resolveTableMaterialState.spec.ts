import { describe, expect, it } from "vitest";
import { VENUE_COLORS } from "../../venueSceneConstants";
import {
  nextSpawnScale,
  resolveTableMaterialState,
} from "./resolveTableMaterialState";

describe("resolveTableMaterialState", () => {
  it("uses reserved colors when reserved", () => {
    expect(resolveTableMaterialState(true, true)).toEqual({
      topColor: VENUE_COLORS.tableTopReserved,
      baseColor: VENUE_COLORS.tableBaseReserved,
      emissive: "#000000",
      emissiveIntensity: 0,
    });
  });

  it("uses selected emissive when selected and not reserved", () => {
    const state = resolveTableMaterialState(true, false);
    expect(state.emissive).toBe("#332200");
    expect(state.emissiveIntensity).toBe(0.3);
  });
});

describe("nextSpawnScale", () => {
  it("steps toward 1 and clamps", () => {
    expect(nextSpawnScale(0.9)).toBeCloseTo(0.98, 10);
    expect(nextSpawnScale(0.95)).toBe(1);
  });
});
