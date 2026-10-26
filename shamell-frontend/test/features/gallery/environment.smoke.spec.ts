import { describe, expect, it } from "vitest";
import { fetchGalleryCategories } from "@/features/gallery/services/fetchGalleryCategories";
import { fetchGalleryPhotos } from "@/features/gallery/services/fetchGalleryPhotos";
import {
  makeGalleryPhotoItem,
  makeGalleryPhotosApiPayload,
  makeGalleryTabItem,
} from "@test/features/gallery/support/fixtures/gallery.fixture";
import {
  FIXTURE_CATEGORY_SLUG,
  FIXTURE_PHOTO_ID,
} from "@test/features/gallery/support/fixtures/uuids.fixture";
import { createMockGalleryPageState } from "@test/features/gallery/support/helpers/mockGalleryPage";

describe("gallery (public) test environment", () => {
  it("exposes usable fixtures and page mock", () => {
    expect(makeGalleryPhotoItem().id).toBe(FIXTURE_PHOTO_ID);
    expect(makeGalleryTabItem().id).toBe(FIXTURE_CATEGORY_SLUG);
    expect(makeGalleryPhotosApiPayload().items).toHaveLength(2);

    const page = createMockGalleryPageState({ isLoading: true });
    expect(page.isLoading).toBe(true);
    expect(page.photos[0]?.id).toBe(FIXTURE_PHOTO_ID);
  });

  it("serves public photos and categories via MSW", async () => {
    const photos = await fetchGalleryPhotos({ filter: "all" });
    expect(photos[0]?.id).toBe(FIXTURE_PHOTO_ID);

    const categories = await fetchGalleryCategories();
    expect(categories[0]).toEqual({ id: "all", label: "All" });
    expect(categories.some((c) => c.id === FIXTURE_CATEGORY_SLUG)).toBe(true);
  });
});
