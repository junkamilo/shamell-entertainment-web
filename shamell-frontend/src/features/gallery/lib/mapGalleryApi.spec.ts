import { describe, expect, it } from "vitest";
import { GALLERY_CATCHALL_SLUG } from "@/lib/gallery/galleryConstants";
import {
  galleryMediaTypeFromItem,
  mapGalleryCategoriesFromApi,
  mapGalleryPhotosFromApi,
} from "./mapGalleryApi";
import {
  makeGalleryCategoriesApiPayload,
  makeGalleryPhotoApiItem,
  makeGalleryPhotosApiPayload,
} from "../test/fixtures/gallery.fixture";
import { FIXTURE_CATEGORY_SLUG } from "../test/fixtures/uuids.fixture";

describe("mapGalleryApi", () => {
  describe("galleryMediaTypeFromItem", () => {
    it("trusts API VIDEO and IMAGE", () => {
      expect(galleryMediaTypeFromItem("x.jpg", "VIDEO")).toBe("VIDEO");
      expect(galleryMediaTypeFromItem("x.mp4", "IMAGE")).toBe("IMAGE");
    });

    it("falls back to URL inference when mediaType missing", () => {
      expect(galleryMediaTypeFromItem("clip.mp4", null)).toBe("VIDEO");
      expect(galleryMediaTypeFromItem("photo.jpg", undefined)).toBe("IMAGE");
    });
  });

  describe("mapGalleryCategoriesFromApi", () => {
    it("returns empty for non-arrays", () => {
      expect(mapGalleryCategoriesFromApi(null)).toEqual([]);
      expect(mapGalleryCategoriesFromApi({})).toEqual([]);
    });

    it("prepends All and drops catch-all slug", () => {
      const tabs = mapGalleryCategoriesFromApi([
        ...makeGalleryCategoriesApiPayload(),
        {
          id: "x",
          name: "All album",
          slug: GALLERY_CATCHALL_SLUG,
          isActive: true,
        },
      ]);
      expect(tabs[0]).toEqual({ id: "all", label: "All" });
      expect(tabs.some((t) => t.id === GALLERY_CATCHALL_SLUG)).toBe(false);
      expect(tabs.some((t) => t.id === FIXTURE_CATEGORY_SLUG)).toBe(true);
    });
  });

  describe("mapGalleryPhotosFromApi", () => {
    it("returns empty for invalid payloads", () => {
      expect(mapGalleryPhotosFromApi(null)).toEqual([]);
      expect(mapGalleryPhotosFromApi([])).toEqual([]);
      expect(mapGalleryPhotosFromApi({ items: null })).toEqual([]);
    });

    it("maps items with alt and media type", () => {
      const photos = mapGalleryPhotosFromApi(makeGalleryPhotosApiPayload());
      expect(photos[0]?.alt).toBe("Weddings — gallery");
      expect(photos[0]?.mediaType).toBe("IMAGE");
      expect(photos[1]?.mediaType).toBe("VIDEO");
    });

    it("trims posterUrl or sets null", () => {
      const withPoster = mapGalleryPhotosFromApi(
        makeGalleryPhotosApiPayload([
          makeGalleryPhotoApiItem({
            posterUrl: "  https://cdn.example.com/poster.jpg  ",
          }),
        ]),
      );
      expect(withPoster[0]?.posterUrl).toBe(
        "https://cdn.example.com/poster.jpg",
      );

      const blank = mapGalleryPhotosFromApi(
        makeGalleryPhotosApiPayload([
          makeGalleryPhotoApiItem({ posterUrl: "   " }),
        ]),
      );
      expect(blank[0]?.posterUrl).toBeNull();
    });
  });
});
