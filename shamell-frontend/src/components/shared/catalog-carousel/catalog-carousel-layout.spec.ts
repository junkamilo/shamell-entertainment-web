import { describe, expect, it } from "vitest";
import { resolveCarouselLayout } from "./catalog-carousel-layout";

describe("resolveCarouselLayout", () => {
  it("uses swipe rail with one visible slide below lg", () => {
    expect(resolveCarouselLayout(false, false)).toEqual({
      visibleCount: 1,
      gapPx: 24,
      slideBasis: "min(88vw, 26rem)",
      useSwipeRail: true,
    });
  });

  it("shows 2 slides on lg when not xl", () => {
    const layout = resolveCarouselLayout(true, false);
    expect(layout.visibleCount).toBe(2);
    expect(layout.useSwipeRail).toBe(false);
    expect(layout.gapPx).toBe(32);
  });

  it("shows 3 slides on xl+", () => {
    expect(resolveCarouselLayout(true, true).visibleCount).toBe(3);
  });

  it("clamps visible count by maxVisible", () => {
    expect(resolveCarouselLayout(true, true, 1).visibleCount).toBe(1);
    expect(resolveCarouselLayout(true, true, 2).visibleCount).toBe(2);
  });
});
