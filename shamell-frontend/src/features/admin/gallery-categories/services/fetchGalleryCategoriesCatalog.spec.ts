import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchGalleryCategoriesCatalog } from "./fetchGalleryCategoriesCatalog";
import {
  makeGalleryCategoriesApiPayload,
  makeGalleryCategoryPreviewsApiPayload,
} from "../test/fixtures/galleryCategories.fixture";
import { FIXTURE_CATEGORY_ID } from "../test/fixtures/uuids.fixture";

describe("fetchGalleryCategoriesCatalog", () => {
  it("loads categories and preview photos", async () => {
    server.use(
      http.get("*/api/v1/gallery/admin/categories", () =>
        HttpResponse.json(makeGalleryCategoriesApiPayload()),
      ),
      http.get("*/api/v1/gallery/admin/photos", () =>
        HttpResponse.json(makeGalleryCategoryPreviewsApiPayload()),
      ),
    );

    const result = await fetchGalleryCategoriesCatalog("token-1");
    expect(result.categories[0]?.id).toBe(FIXTURE_CATEGORY_ID);
    expect(result.photos).toHaveLength(2);
    expect(result.photos[0]?.categoryId).toBe(FIXTURE_CATEGORY_ID);
  });

  it("returns empty photos when photos request fails", async () => {
    server.use(
      http.get("*/api/v1/gallery/admin/categories", () =>
        HttpResponse.json(makeGalleryCategoriesApiPayload()),
      ),
      http.get("*/api/v1/gallery/admin/photos", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );

    const result = await fetchGalleryCategoriesCatalog("token-1");
    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.photos).toEqual([]);
  });

  it("throws when categories request fails", async () => {
    server.use(
      http.get("*/api/v1/gallery/admin/categories", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(fetchGalleryCategoriesCatalog("token-1")).rejects.toThrow(/nope/);
  });
});
