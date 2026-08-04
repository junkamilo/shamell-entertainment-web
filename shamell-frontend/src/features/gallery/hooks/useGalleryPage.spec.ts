/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { createMockGalleryCategoriesState } from "../test/helpers/mockGalleryPage";
import { createMockGalleryPhotosState } from "../test/helpers/mockGalleryPage";
import { FIXTURE_CATEGORY_SLUG } from "../test/fixtures/uuids.fixture";

const searchParamsGetMock = vi.fn(() => null as string | null);
const categoriesMock = vi.fn(() => createMockGalleryCategoriesState());
const photosMock = vi.fn(() => createMockGalleryPhotosState());

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => searchParamsGetMock(key),
  }),
}));

vi.mock("./useGalleryCategories", () => ({
  useGalleryCategories: () => categoriesMock(),
}));

vi.mock("./useGalleryPhotos", () => ({
  useGalleryPhotos: (filter: string) => photosMock(filter),
}));

import { useGalleryPage } from "./useGalleryPage";

describe("useGalleryPage", () => {
  it("defaults filter to all and composes child hooks", () => {
    searchParamsGetMock.mockReturnValue(null);
    const { result } = renderHook(() => useGalleryPage());
    expect(result.current.currentFilter).toBe("all");
    expect(photosMock).toHaveBeenCalledWith("all");
    expect(result.current.categories.length).toBeGreaterThan(0);
    expect(result.current.photos.length).toBeGreaterThan(0);
    expect(result.current.isLoading).toBe(false);
  });

  it("reads filter from search params", () => {
    searchParamsGetMock.mockReturnValue(FIXTURE_CATEGORY_SLUG);
    const { result } = renderHook(() => useGalleryPage());
    expect(result.current.currentFilter).toBe(FIXTURE_CATEGORY_SLUG);
    expect(photosMock).toHaveBeenCalledWith(FIXTURE_CATEGORY_SLUG);
  });

  it("isLoading when either child is loading", () => {
    categoriesMock.mockReturnValue(
      createMockGalleryCategoriesState({ isLoading: true }),
    );
    photosMock.mockReturnValue(createMockGalleryPhotosState({ isLoading: false }));
    const { result } = renderHook(() => useGalleryPage());
    expect(result.current.isLoading).toBe(true);
  });
});
