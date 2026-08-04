import { describe, expect, it } from "vitest";
import {
  GALLERY_PATH as libGalleryPath,
  buildGalleryFilterHref as libBuildGalleryFilterHref,
} from "@/lib/gallery/galleryRoutes";
import { GALLERY_PATH, buildGalleryFilterHref } from "./galleryRoutes";
import { FIXTURE_CATEGORY_SLUG } from "../test/fixtures/uuids.fixture";

describe("galleryRoutes", () => {
  it("re-exports gallery path from lib/gallery", () => {
    expect(GALLERY_PATH).toBe("/gallery");
    expect(GALLERY_PATH).toBe(libGalleryPath);
  });

  it("re-exports buildGalleryFilterHref from lib/gallery", () => {
    expect(buildGalleryFilterHref("all")).toBe(GALLERY_PATH);
    expect(buildGalleryFilterHref("")).toBe(GALLERY_PATH);
    expect(buildGalleryFilterHref(FIXTURE_CATEGORY_SLUG)).toBe(
      `${GALLERY_PATH}?filter=${FIXTURE_CATEGORY_SLUG}`,
    );
    expect(buildGalleryFilterHref).toBe(libBuildGalleryFilterHref);
  });
});
