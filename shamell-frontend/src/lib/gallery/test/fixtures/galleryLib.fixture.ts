import type { GalleryFilter, GalleryItem } from "../../galleryData";
import {
  FIXTURE_GALLERY_CATEGORY,
  FIXTURE_GALLERY_ITEM_ID,
} from "./uuids.fixture";

/** Lightweight stand-in for StaticImageData in page mocks (not for real rendering). */
export function makeStaticImageStub(src = "/stub-gallery.jpg") {
  return {
    src,
    height: 800,
    width: 600,
    blurDataURL: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
  };
}

export function makeGalleryFallbackItem(
  overrides: Partial<GalleryItem> = {},
): GalleryItem {
  return {
    id: FIXTURE_GALLERY_ITEM_ID,
    src: makeStaticImageStub() as GalleryItem["src"],
    alt: "Fire performance - Shamell",
    category: FIXTURE_GALLERY_CATEGORY,
    ...overrides,
  };
}

export function makeGalleryTabFixture(
  id: GalleryFilter = "all",
  label = "All",
) {
  return { id, label };
}
