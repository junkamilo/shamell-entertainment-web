/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeGalleryCategory } from "../test/fixtures/galleryCategories.fixture";
import { FIXTURE_CATEGORY_ID } from "../test/fixtures/uuids.fixture";
import { useGalleryCategoriesForm } from "./useGalleryCategoriesForm";

describe("useGalleryCategoriesForm", () => {
  it("openCategoryCreate resets and opens modal", () => {
    const { result } = renderHook(() => useGalleryCategoriesForm());

    act(() => {
      result.current.setCategoryName("stale");
      result.current.openCategoryCreate();
    });

    expect(result.current.isCategoryModalOpen).toBe(true);
    expect(result.current.editingCategoryId).toBeNull();
    expect(result.current.categoryName).toBe("");
  });

  it("startCategoryEdit fills form and opens modal", () => {
    const { result } = renderHook(() => useGalleryCategoriesForm());
    const category = makeGalleryCategory({ id: FIXTURE_CATEGORY_ID, name: "Weddings" });

    act(() => {
      result.current.startCategoryEdit(category);
    });

    expect(result.current.isCategoryModalOpen).toBe(true);
    expect(result.current.editingCategoryId).toBe(FIXTURE_CATEGORY_ID);
    expect(result.current.categoryName).toBe("Weddings");
  });

  it("closeCategoryModal closes and resets", () => {
    const { result } = renderHook(() => useGalleryCategoriesForm());

    act(() => {
      result.current.startCategoryEdit(makeGalleryCategory());
      result.current.closeCategoryModal();
    });

    expect(result.current.isCategoryModalOpen).toBe(false);
    expect(result.current.editingCategoryId).toBeNull();
    expect(result.current.categoryName).toBe("");
  });
});
