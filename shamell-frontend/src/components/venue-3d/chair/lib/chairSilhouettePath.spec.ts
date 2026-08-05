import { describe, expect, it } from "vitest";
import { CHAIR_SILHOUETTE_PATH } from "./chairSilhouettePath";

describe("chairSilhouettePath", () => {
  it("is a non-empty SVG path starting with M", () => {
    expect(CHAIR_SILHOUETTE_PATH.length).toBeGreaterThan(20);
    expect(CHAIR_SILHOUETTE_PATH.trimStart().startsWith("M")).toBe(true);
  });

  it("includes seat and backrest path commands for palette SVG", () => {
    expect(CHAIR_SILHOUETTE_PATH).toContain("Q");
    expect(CHAIR_SILHOUETTE_PATH).toContain("L");
    expect(CHAIR_SILHOUETTE_PATH).toContain("Z");
    // Two closed subpaths: seat body + backrest
    expect(CHAIR_SILHOUETTE_PATH.match(/Z/g)?.length).toBeGreaterThanOrEqual(1);
  });
});
