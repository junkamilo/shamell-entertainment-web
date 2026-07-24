import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeGalleryPhoto } from "../test/fixtures/gallery.fixture";
import { formatRelativeEn, isVideoMedia } from "./galleryDisplay";

describe("galleryDisplay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-20T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("formatRelativeEn returns em dash for missing or invalid", () => {
    expect(formatRelativeEn(undefined)).toBe("—");
    expect(formatRelativeEn("not-a-date")).toBe("—");
  });

  it("formatRelativeEn returns Just now for recent timestamps", () => {
    expect(formatRelativeEn("2026-07-20T11:59:30.000Z")).toBe("Just now");
  });

  it("formatRelativeEn returns minutes, hours, and days", () => {
    expect(formatRelativeEn("2026-07-20T11:50:00.000Z")).toBe("10 min ago");
    expect(formatRelativeEn("2026-07-20T09:00:00.000Z")).toBe("3h ago");
    expect(formatRelativeEn("2026-07-18T12:00:00.000Z")).toBe("2d ago");
  });

  it("formatRelativeEn falls back to locale date after a week", () => {
    const label = formatRelativeEn("2026-07-01T12:00:00.000Z");
    expect(label).not.toMatch(/ago$/);
    expect(label).not.toBe("—");
  });

  it("isVideoMedia detects VIDEO mediaType", () => {
    expect(isVideoMedia(makeGalleryPhoto({ mediaType: "VIDEO" }))).toBe(true);
    expect(isVideoMedia(makeGalleryPhoto({ mediaType: "IMAGE" }))).toBe(false);
    expect(isVideoMedia(makeGalleryPhoto({ mediaType: undefined }))).toBe(false);
  });
});
