import { describe, expect, it } from "vitest";
import { rectCenterToViewBox } from "./floorLayoutCoords";

describe("rectCenterToViewBox", () => {
  it("returns viewBox center when getScreenCTM is null", () => {
    const svg = {
      createSVGPoint: () => ({ x: 0, y: 0 }),
      getScreenCTM: () => null,
    } as unknown as SVGSVGElement;

    expect(rectCenterToViewBox(svg, 614, 944, { left: 0, top: 0, width: 100, height: 50 })).toEqual({
      x: 307,
      y: 472,
    });
  });
});
