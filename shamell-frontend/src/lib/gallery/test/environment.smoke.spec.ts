/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import {
  makeGalleryFallbackItem,
  makeGalleryTabFixture,
} from "./fixtures/galleryLib.fixture";
import {
  FIXTURE_GALLERY_CATCHALL_SLUG,
  FIXTURE_GALLERY_ITEM_ID,
  FIXTURE_GALLERY_UPLOAD_MAX_FILES,
} from "./fixtures/uuids.fixture";
import { createMockGalleryFallbackState } from "./helpers/mockGalleryLib";
import {
  GALLERY_CATCHALL_SLUG,
  GALLERY_UPLOAD_MAX_FILES,
} from "../galleryConstants";
import { galleryItems, galleryTabs } from "../galleryData";
import { GALLERY_PATH } from "../galleryRoutes";

describe("gallery lib test environment", () => {
  it("exposes usable fixtures and mocks", () => {
    expect(makeGalleryFallbackItem().id).toBe(FIXTURE_GALLERY_ITEM_ID);
    expect(makeGalleryTabFixture().id).toBe("all");
    expect(createMockGalleryFallbackState().uploadMaxFiles).toBe(
      FIXTURE_GALLERY_UPLOAD_MAX_FILES,
    );
  });

  it("keeps constants and fallback catalogs wired for smoke", () => {
    expect(GALLERY_PATH).toBe("/gallery");
    expect(GALLERY_CATCHALL_SLUG).toBe(FIXTURE_GALLERY_CATCHALL_SLUG);
    expect(GALLERY_UPLOAD_MAX_FILES).toBe(FIXTURE_GALLERY_UPLOAD_MAX_FILES);
    expect(galleryTabs[0]?.id).toBe("all");
    expect(galleryItems.length).toBeGreaterThan(0);
  });
});
