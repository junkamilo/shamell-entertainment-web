import { describe, expect, it } from "vitest";
import { GALLERY_PATH, buildGalleryFilterHref } from "./galleryRoutes";

describe("galleryRoutes", () => {
  it("exports the public gallery path", () => {
    expect(GALLERY_PATH).toBe("/gallery");
  });

  it("builds filter hrefs", () => {
    expect(buildGalleryFilterHref("all")).toBe(GALLERY_PATH);
    expect(buildGalleryFilterHref("")).toBe(GALLERY_PATH);
    expect(buildGalleryFilterHref("fire")).toBe(
      `${GALLERY_PATH}?filter=fire`,
    );
  });
});
