/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GALLERY_CATCHALL_SLUG } from "@/lib/galleryConstants";
import {
  makeGalleryCategory,
  makeGalleryPhoto,
} from "../test/fixtures/gallery.fixture";
import {
  FIXTURE_CATEGORY_ID,
  FIXTURE_CATEGORY_ID_2,
  FIXTURE_PHOTO_ID,
} from "../test/fixtures/uuids.fixture";
import { useGalleryPhotoForm } from "./useGalleryPhotoForm";

describe("useGalleryPhotoForm", () => {
  const activeCategories = [
    makeGalleryCategory({
      id: FIXTURE_CATEGORY_ID,
      name: "All",
      slug: GALLERY_CATCHALL_SLUG,
    }),
    makeGalleryCategory({
      id: FIXTURE_CATEGORY_ID_2,
      name: "Weddings",
      slug: "weddings",
    }),
  ];
  const sortedActiveCategories = activeCategories;

  it("openPhotoCreate prefers the catch-all category", () => {
    const { result } = renderHook(() =>
      useGalleryPhotoForm({ activeCategories, sortedActiveCategories }),
    );

    act(() => {
      result.current.openPhotoCreate();
    });

    expect(result.current.selectedCategoryId).toBe(FIXTURE_CATEGORY_ID);
    expect(result.current.editingPhotoId).toBeNull();
  });

  it("openUploadToCategory sets the chosen category", () => {
    const { result } = renderHook(() =>
      useGalleryPhotoForm({ activeCategories, sortedActiveCategories }),
    );

    act(() => {
      result.current.openUploadToCategory(FIXTURE_CATEGORY_ID_2);
    });

    expect(result.current.selectedCategoryId).toBe(FIXTURE_CATEGORY_ID_2);
  });

  it("startPhotoEdit sets editing state", () => {
    const { result } = renderHook(() =>
      useGalleryPhotoForm({ activeCategories, sortedActiveCategories }),
    );
    const photo = makeGalleryPhoto({
      id: FIXTURE_PHOTO_ID,
      category: {
        id: FIXTURE_CATEGORY_ID_2,
        name: "Weddings",
        slug: "weddings",
      },
    });

    act(() => {
      result.current.startPhotoEdit(photo);
    });

    expect(result.current.editingPhotoId).toBe(FIXTURE_PHOTO_ID);
    expect(result.current.selectedCategoryId).toBe(FIXTURE_CATEGORY_ID_2);
    expect(result.current.originalCategoryId).toBe(FIXTURE_CATEGORY_ID_2);
    expect(result.current.imageFiles).toEqual([]);
  });

  it("canSubmitPhoto requires files for create and allows category change for edit", () => {
    const { result } = renderHook(() =>
      useGalleryPhotoForm({ activeCategories, sortedActiveCategories }),
    );

    act(() => {
      result.current.openUploadToCategory(FIXTURE_CATEGORY_ID_2);
    });
    expect(result.current.canSubmitPhoto).toBe(false);

    act(() => {
      result.current.setImageFiles([
        new File(["x"], "a.jpg", { type: "image/jpeg" }),
      ]);
    });
    expect(result.current.canSubmitPhoto).toBe(true);

    act(() => {
      result.current.startPhotoEdit(
        makeGalleryPhoto({
          category: {
            id: FIXTURE_CATEGORY_ID_2,
            name: "Weddings",
            slug: "weddings",
          },
        }),
      );
    });
    expect(result.current.canSubmitPhoto).toBe(false);

    act(() => {
      result.current.setSelectedCategoryId(FIXTURE_CATEGORY_ID);
    });
    expect(result.current.canSubmitPhoto).toBe(true);
  });
});
