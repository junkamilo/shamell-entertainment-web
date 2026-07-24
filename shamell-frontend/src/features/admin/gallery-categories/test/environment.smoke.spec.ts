import { describe, expect, it } from "vitest";
import { fetchGalleryCategoriesCatalog } from "../services/fetchGalleryCategoriesCatalog";
import { postAdminGalleryCategory } from "../services/postAdminGalleryCategory";
import {
  makeGalleryCategory,
  makeGalleryCategoriesApiPayload,
} from "./fixtures/galleryCategories.fixture";
import { FIXTURE_CATEGORY_ID } from "./fixtures/uuids.fixture";
import { createMockGalleryCategoriesPageState } from "./helpers/mockGalleryCategoriesPage";

describe("gallery-categories test environment", () => {
  it("exposes usable fixtures and page mock", () => {
    expect(makeGalleryCategory().id).toBe(FIXTURE_CATEGORY_ID);
    expect(makeGalleryCategoriesApiPayload()).toHaveLength(2);

    const page = createMockGalleryCategoriesPageState({
      form: { isCategoryModalOpen: true },
    });
    expect(page.form.isCategoryModalOpen).toBe(true);
    page.form.openCategoryCreate();
    expect(page.form.openCategoryCreate).toHaveBeenCalled();
  });

  it("serves categories catalog and create via MSW", async () => {
    const catalog = await fetchGalleryCategoriesCatalog("token-1");
    expect(catalog.categories[0]?.id).toBe(FIXTURE_CATEGORY_ID);

    await expect(postAdminGalleryCategory("token-1", "Weddings")).resolves.toBeUndefined();
  });
});
