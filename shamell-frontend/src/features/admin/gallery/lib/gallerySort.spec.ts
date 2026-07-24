import { describe, expect, it } from "vitest";
import { GALLERY_CATCHALL_SLUG } from "@/lib/galleryConstants";
import { makeGalleryCategory } from "../test/fixtures/gallery.fixture";
import {
  FIXTURE_CATEGORY_ID,
  FIXTURE_CATEGORY_ID_2,
} from "../test/fixtures/uuids.fixture";
import { sortActiveCategories } from "./gallerySort";

describe("sortActiveCategories", () => {
  it("filters inactive categories", () => {
    const result = sortActiveCategories([
      makeGalleryCategory({ isActive: true }),
      makeGalleryCategory({
        id: FIXTURE_CATEGORY_ID_2,
        name: "Corporate",
        slug: "corporate",
        isActive: false,
      }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(FIXTURE_CATEGORY_ID);
  });

  it("puts catch-all slug first then sorts by name", () => {
    const result = sortActiveCategories([
      makeGalleryCategory({
        id: "a",
        name: "Zebra",
        slug: "zebra",
        isActive: true,
      }),
      makeGalleryCategory({
        id: "b",
        name: "All",
        slug: GALLERY_CATCHALL_SLUG,
        isActive: true,
      }),
      makeGalleryCategory({
        id: "c",
        name: "Alpha",
        slug: "alpha",
        isActive: true,
      }),
    ]);
    expect(result.map((c) => c.slug)).toEqual([
      GALLERY_CATCHALL_SLUG,
      "alpha",
      "zebra",
    ]);
  });
});
