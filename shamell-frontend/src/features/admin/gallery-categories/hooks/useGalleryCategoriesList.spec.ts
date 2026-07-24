/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  makeGalleryCategory,
  makeGalleryCategoryPhotoPreview,
} from "../test/fixtures/galleryCategories.fixture";
import {
  FIXTURE_CATEGORY_ID,
  FIXTURE_CATEGORY_ID_2,
  FIXTURE_CATEGORY_ID_3,
} from "../test/fixtures/uuids.fixture";
import { useGalleryCategoriesList } from "./useGalleryCategoriesList";

describe("useGalleryCategoriesList", () => {
  const categories = [
    makeGalleryCategory(),
    makeGalleryCategory({
      id: FIXTURE_CATEGORY_ID_2,
      name: "Corporate",
      slug: "corporate",
      isActive: false,
    }),
    makeGalleryCategory({
      id: FIXTURE_CATEGORY_ID_3,
      name: "Alpha",
      slug: "alpha",
      isActive: true,
    }),
  ];
  const photos = [
    makeGalleryCategoryPhotoPreview(),
    makeGalleryCategoryPhotoPreview({
      imageUrl: "https://cdn.example.com/gallery/preview-2.jpg",
    }),
  ];

  it("computes stats and spotlight", () => {
    const { result } = renderHook(() =>
      useGalleryCategoriesList({ categories, photos }),
    );

    expect(result.current.stats).toEqual({
      total: 3,
      active: 2,
      inactive: 1,
      withMedia: 1,
      star: "Weddings",
    });
    expect(result.current.spotlightCategoryId).toBe(FIXTURE_CATEGORY_ID);
    expect(result.current.photoCountByCategory[FIXTURE_CATEGORY_ID]).toBe(2);
  });

  it("filters by search and tab", () => {
    const { result } = renderHook(() =>
      useGalleryCategoriesList({ categories, photos }),
    );

    act(() => {
      result.current.setSearchQuery("corp");
    });
    expect(result.current.filteredCategories).toHaveLength(1);
    expect(result.current.filteredCategories[0]?.id).toBe(FIXTURE_CATEGORY_ID_2);

    act(() => {
      result.current.setSearchQuery("");
      result.current.setFilterTab("active");
    });
    expect(result.current.filteredCategories.every((c) => c.isActive)).toBe(true);

    act(() => {
      result.current.setFilterTab("inactive");
    });
    expect(result.current.filteredCategories).toHaveLength(1);
    expect(result.current.filteredCategories[0]?.isActive).toBe(false);
  });

  it("puts spotlight category first when present in filtered list", () => {
    const { result } = renderHook(() =>
      useGalleryCategoriesList({ categories, photos }),
    );

    expect(result.current.filteredCategories[0]?.id).toBe(FIXTURE_CATEGORY_ID);
  });

  it("toggles category expanded state", () => {
    const { result } = renderHook(() =>
      useGalleryCategoriesList({ categories, photos }),
    );

    act(() => {
      result.current.toggleCategoryExpanded(FIXTURE_CATEGORY_ID);
    });
    expect(result.current.expandedCategoryIds.has(FIXTURE_CATEGORY_ID)).toBe(true);

    act(() => {
      result.current.toggleCategoryExpanded(FIXTURE_CATEGORY_ID);
    });
    expect(result.current.expandedCategoryIds.has(FIXTURE_CATEGORY_ID)).toBe(false);
  });
});
