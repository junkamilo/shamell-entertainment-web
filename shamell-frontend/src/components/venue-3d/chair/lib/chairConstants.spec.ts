import { describe, expect, it } from "vitest";
import {
  CHAIR_BACK,
  CHAIR_COLORS,
  CHAIR_LEG,
  CHAIR_MATERIAL,
  CHAIR_SEAT,
} from "./chairConstants";

describe("chairConstants", () => {
  it("exposes stable seat / back / leg dimensions", () => {
    expect(CHAIR_SEAT).toMatchObject({
      width: 0.42,
      depth: 0.4,
      height: 0.08,
      y: 0.38,
      cornerRadius: 0.06,
    });
    expect(CHAIR_BACK).toMatchObject({
      width: 0.36,
      height: 0.4,
      thickness: 0.06,
      z: -0.2,
      topRadius: 0.08,
    });
    expect(CHAIR_LEG).toEqual({ radius: 0.018, height: 0.36 });
  });

  it("exposes color and material keys used by meshes", () => {
    expect(Object.keys(CHAIR_COLORS).sort()).toEqual([
      "frame",
      "frameReserved",
      "velvet",
      "velvetHighlight",
      "velvetReserved",
    ]);
    expect(CHAIR_MATERIAL.velvet).toEqual({ roughness: 0.92, metalness: 0.02 });
    expect(CHAIR_MATERIAL.frame).toEqual({ roughness: 0.85, metalness: 0.08 });
  });
});
