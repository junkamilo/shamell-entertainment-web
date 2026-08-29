import { describe, expect, it } from "vitest";
import {
  NIGHT_ROW_SCROLL_THRESHOLD,
  nightRowCardClass,
  nightRowContainerClass,
  nightRowNeedsScroll,
} from "./nightExperienceRow";

describe("nightExperienceRow", () => {
  it("scrolls when count reaches threshold", () => {
    expect(nightRowNeedsScroll(0)).toBe(false);
    expect(nightRowNeedsScroll(3)).toBe(false);
    expect(nightRowNeedsScroll(NIGHT_ROW_SCROLL_THRESHOLD)).toBe(true);
    expect(nightRowNeedsScroll(6)).toBe(true);
  });

  it("uses overflow-x container class when scrolling", () => {
    expect(nightRowContainerClass(5)).toContain("overflow-x-auto");
    expect(nightRowContainerClass(5)).toContain("gap-5");
    expect(nightRowContainerClass(3)).not.toContain("overflow-x-auto");
    expect(nightRowContainerClass(3)).toContain("md:grid-cols-3");
    expect(nightRowContainerClass(3)).toContain("gap-5");
  });

  it("uses snap card width when scrolling", () => {
    expect(nightRowCardClass(5)).toContain("snap-start");
    expect(nightRowCardClass(5)).toContain("shrink-0");
    expect(nightRowCardClass(2)).toContain("w-full");
  });
});
