import { describe, expect, it } from "vitest";
import { facingStageRotationDegrees } from "./facingStageRotation";

describe("facingStageRotationDegrees", () => {
  it("returns a finite angle when chair is offset from stage", () => {
    const degrees = facingStageRotationDegrees(100, 200, 614, 944, 0, -8);
    expect(Number.isFinite(degrees)).toBe(true);
    expect(degrees).toBeGreaterThanOrEqual(-180);
    expect(degrees).toBeLessThanOrEqual(180);
  });
});
