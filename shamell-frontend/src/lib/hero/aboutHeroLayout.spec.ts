import { describe, expect, it } from "vitest";
import {
  ABOUT_HERO_VIDEO_ASPECT,
  ABOUT_HERO_VIDEO_MAX_HEIGHT,
  aboutHeroImageCardClassName,
  aboutHeroMediaClassName,
  aboutHeroMediaFrameClassName,
  aboutHeroVideoCardClassName,
} from "./aboutHeroLayout";

describe("aboutHeroLayout", () => {
  it("exposes 9:16 aspect and height caps", () => {
    expect(ABOUT_HERO_VIDEO_ASPECT).toBeCloseTo(0.5625);
    expect(ABOUT_HERO_VIDEO_MAX_HEIGHT.base).toContain("65dvh");
    expect(ABOUT_HERO_VIDEO_MAX_HEIGHT.xl2).toContain("740px");
  });

  it("builds public and preview video card class names", () => {
    const publicCard = aboutHeroVideoCardClassName();
    expect(publicCard).toContain("aspect-9/16");
    expect(publicCard).toContain("min(65dvh,600px)");

    const preview = aboutHeroVideoCardClassName({
      variant: "preview",
      className: "extra",
    });
    expect(preview).toContain("min(52dvh,480px)");
    expect(preview).toContain("extra");
  });

  it("builds image card, frame, and media fit classes", () => {
    expect(aboutHeroImageCardClassName("x")).toContain("aspect-3/4");
    expect(aboutHeroImageCardClassName("x")).toContain("x");
    expect(aboutHeroMediaFrameClassName("bg-black")).toContain("bg-black");
    expect(aboutHeroMediaClassName()).toContain("object-contain");
  });
});
