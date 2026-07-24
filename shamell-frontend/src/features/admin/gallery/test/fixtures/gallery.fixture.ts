import type { GalleryCategory, GalleryPhoto } from "../../types/gallery.types";
import {
  FIXTURE_CATEGORY_ID,
  FIXTURE_CATEGORY_ID_2,
  FIXTURE_PHOTO_ID,
  FIXTURE_PHOTO_ID_2,
} from "./uuids.fixture";

export function makeGalleryCategory(
  overrides: Partial<GalleryCategory> = {},
): GalleryCategory {
  return {
    id: FIXTURE_CATEGORY_ID,
    name: "Weddings",
    slug: "weddings",
    isActive: true,
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-20T12:00:00.000Z",
    ...overrides,
  };
}

export function makeGalleryPhoto(overrides: Partial<GalleryPhoto> = {}): GalleryPhoto {
  return {
    id: FIXTURE_PHOTO_ID,
    imageUrl: "https://cdn.example.com/gallery/photo.jpg",
    isActive: true,
    mediaType: "IMAGE",
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-20T12:00:00.000Z",
    category: {
      id: FIXTURE_CATEGORY_ID,
      name: "Weddings",
      slug: "weddings",
    },
    ...overrides,
  };
}

export function makeGalleryCategoriesApiPayload(
  items: GalleryCategory[] = [
    makeGalleryCategory(),
    makeGalleryCategory({
      id: FIXTURE_CATEGORY_ID_2,
      name: "Corporate",
      slug: "corporate",
      isActive: false,
    }),
  ],
) {
  return items;
}

export function makeGalleryPhotosApiPayload(
  items: GalleryPhoto[] = [
    makeGalleryPhoto(),
    makeGalleryPhoto({
      id: FIXTURE_PHOTO_ID_2,
      imageUrl: "https://cdn.example.com/gallery/photo-2.jpg",
      isActive: false,
      mediaType: "VIDEO",
      category: {
        id: FIXTURE_CATEGORY_ID,
        name: "Weddings",
        slug: "weddings",
      },
    }),
  ],
) {
  return items;
}
