import {
  makeGalleryFallbackItem,
  makeGalleryTabFixture,
} from "../fixtures/galleryLib.fixture";
import {
  FIXTURE_GALLERY_CATCHALL_SLUG,
  FIXTURE_GALLERY_UPLOAD_MAX_FILES,
} from "../fixtures/uuids.fixture";

export function createMockGalleryFallbackState(
  overrides: Record<string, unknown> = {},
) {
  return {
    catchallSlug: FIXTURE_GALLERY_CATCHALL_SLUG,
    uploadMaxFiles: FIXTURE_GALLERY_UPLOAD_MAX_FILES,
    tabs: [
      makeGalleryTabFixture("all", "All"),
      makeGalleryTabFixture("fire", "Fire Performance"),
    ],
    items: [makeGalleryFallbackItem()],
    filter: "all" as const,
    ...overrides,
  };
}
