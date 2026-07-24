import type {
  GalleryCategory,
  GalleryCategoryPhotoPreview,
} from "../../types/galleryCategories.types";
import {
  FIXTURE_CATEGORY_ID,
  FIXTURE_CATEGORY_ID_2,
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

export function makeGalleryCategoryPhotoPreview(
  overrides: Partial<GalleryCategoryPhotoPreview> = {},
): GalleryCategoryPhotoPreview {
  return {
    categoryId: FIXTURE_CATEGORY_ID,
    imageUrl: "https://cdn.example.com/gallery/preview.jpg",
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

export function makeGalleryCategoryPreviewsApiPayload(
  items: GalleryCategoryPhotoPreview[] = [
    makeGalleryCategoryPhotoPreview(),
    makeGalleryCategoryPhotoPreview({
      imageUrl: "https://cdn.example.com/gallery/preview-2.jpg",
    }),
  ],
) {
  return items;
}
