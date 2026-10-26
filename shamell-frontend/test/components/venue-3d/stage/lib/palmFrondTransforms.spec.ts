import { describe, expect, it } from "vitest";
import { PALM_FROND_ANGLES, palmFrondTransforms } from "@/components/venue-3d/stage/lib/palmFrondTransforms";

describe("palmFrondTransforms", () => {
  it("returns one transform per angle", () => {
    const fronds = palmFrondTransforms(1, 2, PALM_FROND_ANGLES);
    expect(fronds).toHaveLength(PALM_FROND_ANGLES.length);
    expect(fronds[0]?.position[1]).toBeCloseTo(2.25, 10);
  });
});
