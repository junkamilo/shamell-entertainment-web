import { describe, expect, it } from "vitest";
import { stagePlankLayout } from "./stagePlankLayout";

describe("stagePlankLayout", () => {
  it("splits width into equal planks with gaps", () => {
    const { plankWidth, planks } = stagePlankLayout(10, 5, 0.04);
    expect(planks).toHaveLength(5);
    expect(plankWidth).toBeCloseTo((10 - 0.04 * 4) / 5, 10);
    expect(planks[0]?.x).toBeCloseTo(plankWidth / 2, 10);
    expect(planks[1]?.x).toBeCloseTo(plankWidth / 2 + plankWidth + 0.04, 10);
  });
});
