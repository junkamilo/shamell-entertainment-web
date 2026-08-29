import { describe, expect, it } from "vitest";
import {
  disposeGeometry,
  getChairSharedGeometries,
  getTableSharedGeometries,
} from "./chairSharedGeometries";

describe("chairSharedGeometries", () => {
  it("returns geometries for high and mobile profiles", () => {
    const high = getChairSharedGeometries("high");
    const mobile = getChairSharedGeometries("mobile");
    expect(high.seat).toBeTruthy();
    expect(mobile.seat).toBeTruthy();
    expect(high.leg).toBeTruthy();
  });

  it("builds table geometries and disposes safely", () => {
    const geo = getTableSharedGeometries(0.5, 0.4, "mobile");
    expect(geo.top).toBeTruthy();
    expect(getTableSharedGeometries(0.5, 0.4, "mobile")).toBe(geo);
    expect(getTableSharedGeometries(0.5, 0.4, "high").accent).toBeTruthy();
    expect(() => disposeGeometry(geo.top)).not.toThrow();
  });

  it("reuses cached chair geometries per profile", () => {
    expect(getChairSharedGeometries("high")).toBe(getChairSharedGeometries("high"));
    expect(getChairSharedGeometries("mobile")).toBe(getChairSharedGeometries("mobile"));
  });
});
