import type {
  GalleryCategoryApiItem,
  GalleryPhotoApiItem,
  GalleryPhotoItem,
  GalleryPhotosResponse,
  GalleryTabItem,
} from "../../types/gallery.types";
import {
  FIXTURE_CATEGORY_ID,
  FIXTURE_CATEGORY_ID_2,
  FIXTURE_CATEGORY_SLUG,
  FIXTURE_CATEGORY_SLUG_2,
  FIXTURE_PHOTO_ID,
  FIXTURE_PHOTO_ID_2,
} from "./uuids.fixture";

export function makeGalleryCategoryApiItem(
  overrides: Partial<GalleryCategoryApiItem> = {},
): GalleryCategoryApiItem {
  return {
    id: FIXTURE_CATEGORY_ID,
    name: "Weddings",
    slug: FIXTURE_CATEGORY_SLUG,
    isActive: true,
    ...overrides,
  };
}

export function makeGalleryCategoriesApiPayload(
  items: GalleryCategoryApiItem[] = [
    makeGalleryCategoryApiItem(),
    makeGalleryCategoryApiItem({
      id: FIXTURE_CATEGORY_ID_2,
      name: "Shows",
      slug: FIXTURE_CATEGORY_SLUG_2,
    }),
  ],
) {
  return items;
}

export function makeGalleryPhotoApiItem(
  overrides: Partial<GalleryPhotoApiItem> = {},
): GalleryPhotoApiItem {
  return {
    id: FIXTURE_PHOTO_ID,
    imageUrl: "https://cdn.example.com/gallery/wedding-1.jpg",
    posterUrl: null,
    mediaType: "IMAGE",
    category: {
      id: FIXTURE_CATEGORY_ID,
      name: "Weddings",
      slug: FIXTURE_CATEGORY_SLUG,
    },
    ...overrides,
  };
}

export function makeGalleryPhotosApiPayload(
  items: GalleryPhotoApiItem[] = [
    makeGalleryPhotoApiItem(),
    makeGalleryPhotoApiItem({
      id: FIXTURE_PHOTO_ID_2,
      imageUrl: "https://cdn.example.com/gallery/show-1.mp4",
      mediaType: "VIDEO",
      category: {
        id: FIXTURE_CATEGORY_ID_2,
        name: "Shows",
        slug: FIXTURE_CATEGORY_SLUG_2,
      },
    }),
  ],
): GalleryPhotosResponse {
  return {
    items,
    pagination: {
      page: 1,
      limit: 24,
      total: items.length,
      totalPages: 1,
    },
  };
}

export function makeGalleryTabItem(
  overrides: Partial<GalleryTabItem> = {},
): GalleryTabItem {
  return {
    id: FIXTURE_CATEGORY_SLUG,
    label: "Weddings",
    ...overrides,
  };
}

export function makeGalleryPhotoItem(
  overrides: Partial<GalleryPhotoItem> = {},
): GalleryPhotoItem {
  return {
    id: FIXTURE_PHOTO_ID,
    src: "https://cdn.example.com/gallery/wedding-1.jpg",
    posterUrl: null,
    alt: "Weddings — gallery",
    categorySlug: FIXTURE_CATEGORY_SLUG,
    mediaType: "IMAGE",
    ...overrides,
  };
}
