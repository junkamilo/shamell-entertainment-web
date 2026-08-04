import { vi } from "vitest";
import {
  makeGalleryPhotoItem,
  makeGalleryTabItem,
} from "../fixtures/gallery.fixture";
import {
  FIXTURE_CATEGORY_SLUG,
  FIXTURE_CATEGORY_SLUG_2,
  FIXTURE_PHOTO_ID_2,
} from "../fixtures/uuids.fixture";

export function createMockGalleryPageState(
  overrides: Record<string, unknown> = {},
) {
  return {
    currentFilter: "all",
    categories: [
      { id: "all", label: "All" },
      makeGalleryTabItem(),
      makeGalleryTabItem({ id: FIXTURE_CATEGORY_SLUG_2, label: "Shows" }),
    ],
    photos: [
      makeGalleryPhotoItem(),
      makeGalleryPhotoItem({
        id: FIXTURE_PHOTO_ID_2,
        src: "https://cdn.example.com/gallery/show-1.mp4",
        alt: "Shows — gallery",
        categorySlug: FIXTURE_CATEGORY_SLUG_2,
        mediaType: "VIDEO",
      }),
    ],
    isLoading: false,
    ...overrides,
  };
}

export function createMockGalleryPhotosState(
  overrides: Record<string, unknown> = {},
) {
  return {
    photos: [makeGalleryPhotoItem()],
    isLoading: false,
    ...overrides,
  };
}

export function createMockGalleryCategoriesState(
  overrides: Record<string, unknown> = {},
) {
  return {
    categories: [
      { id: "all", label: "All" },
      makeGalleryTabItem({ id: FIXTURE_CATEGORY_SLUG }),
    ],
    isLoading: false,
    ...overrides,
  };
}

export function createSearchParamsMock(filter: string | null = null) {
  return {
    get: vi.fn((key: string) => (key === "filter" ? filter : null)),
  };
}
