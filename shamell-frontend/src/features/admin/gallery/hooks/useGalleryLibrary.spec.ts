/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  makeGalleryCategory,
  makeGalleryPhoto,
} from "../test/fixtures/gallery.fixture";
import {
  FIXTURE_CATEGORY_ID,
  FIXTURE_CATEGORY_ID_2,
  FIXTURE_PHOTO_ID_2,
} from "../test/fixtures/uuids.fixture";
import { useGalleryLibrary } from "./useGalleryLibrary";

describe("useGalleryLibrary", () => {
  const categories = [
    makeGalleryCategory(),
    makeGalleryCategory({
      id: FIXTURE_CATEGORY_ID_2,
      name: "Corporate",
      slug: "corporate",
      isActive: false,
    }),
  ];
  const photos = [
    makeGalleryPhoto(),
    makeGalleryPhoto({
      id: FIXTURE_PHOTO_ID_2,
      isActive: false,
      category: {
        id: FIXTURE_CATEGORY_ID,
        name: "Weddings",
        slug: "weddings",
      },
    }),
  ];

  it("computes stats and active categories", () => {
    const { result } = renderHook(() =>
      useGalleryLibrary({ categories, photos }),
    );

    expect(result.current.activeCategories).toHaveLength(1);
    expect(result.current.stats).toEqual({
      total: 2,
      visible: 1,
      catsWith: 1,
    });
    expect(result.current.countByCategory[FIXTURE_CATEGORY_ID]).toBe(2);
  });

  it("filters photos by search query", () => {
    const { result } = renderHook(() =>
      useGalleryLibrary({ categories, photos }),
    );

    act(() => {
      result.current.setSearchQuery("weddings");
    });
    expect(result.current.filteredPhotos).toHaveLength(2);

    act(() => {
      result.current.setSearchQuery("no-match");
    });
    expect(result.current.filteredPhotos).toHaveLength(0);
  });

  it("toggles album expanded state", () => {
    const { result } = renderHook(() =>
      useGalleryLibrary({ categories, photos }),
    );

    act(() => {
      result.current.toggleAlbumExpanded(FIXTURE_CATEGORY_ID);
    });
    expect(result.current.expandedAlbumIds.has(FIXTURE_CATEGORY_ID)).toBe(true);

    act(() => {
      result.current.toggleAlbumExpanded(FIXTURE_CATEGORY_ID);
    });
    expect(result.current.expandedAlbumIds.has(FIXTURE_CATEGORY_ID)).toBe(false);
  });
});
