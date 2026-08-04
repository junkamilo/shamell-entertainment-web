import { describe, expect, it } from "vitest";
import {
  SELECTION_STROKE,
  STANDALONE_CHAIR_VISUAL,
  tableVisualForSize,
} from "./shapeConfig";

describe("shapeConfig", () => {
  it("returns circle visuals with decreasing size for table sizes", () => {
    const large = tableVisualForSize("LARGE");
    const medium = tableVisualForSize("MEDIUM");
    const small = tableVisualForSize("SMALL");

    expect(large.shape).toBe("circle");
    expect(medium.shape).toBe("circle");
    expect(small.shape).toBe("circle");
    expect(large.size).toBeGreaterThan(medium.size);
    expect(medium.size).toBeGreaterThan(small.size);
  });

  it("exposes standalone chair as rect and a selection stroke", () => {
    expect(STANDALONE_CHAIR_VISUAL.shape).toBe("rect");
    expect(typeof SELECTION_STROKE).toBe("string");
    expect(SELECTION_STROKE.length).toBeGreaterThan(0);
  });
});
