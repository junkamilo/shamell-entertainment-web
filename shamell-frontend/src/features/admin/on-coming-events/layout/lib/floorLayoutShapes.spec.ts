import { describe, expect, it } from "vitest";
import {
  SELECTION_STROKE,
  STANDALONE_CHAIR_VISUAL,
  tableVisualForSize,
} from "./floorLayoutShapes";

describe("floorLayoutShapes", () => {
  it("re-exports table visuals for each size", () => {
    expect(tableVisualForSize("LARGE").fill).toBeTruthy();
    expect(tableVisualForSize("MEDIUM").fill).toBeTruthy();
    expect(tableVisualForSize("SMALL").fill).toBeTruthy();
  });

  it("re-exports standalone chair and selection stroke config", () => {
    expect(STANDALONE_CHAIR_VISUAL.fill).toBeTruthy();
    expect(SELECTION_STROKE).toBeTruthy();
  });
});
