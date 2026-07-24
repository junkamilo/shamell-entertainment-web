import { describe, expect, it } from "vitest";
import { FIXTURE_CATEGORY_ID } from "../test/fixtures/uuids.fixture";
import { mapGalleryPhotoPreviewsFromApi } from "./mapGalleryPhotoPreviewsFromApi";

describe("mapGalleryPhotoPreviewsFromApi", () => {
  it("returns empty for non-arrays", () => {
    expect(mapGalleryPhotoPreviewsFromApi(null)).toEqual([]);
    expect(mapGalleryPhotoPreviewsFromApi({})).toEqual([]);
  });

  it("maps valid previews and drops incomplete rows", () => {
    expect(
      mapGalleryPhotoPreviewsFromApi([
        {
          categoryId: FIXTURE_CATEGORY_ID,
          imageUrl: "https://cdn.example.com/preview.jpg",
        },
        { categoryId: FIXTURE_CATEGORY_ID },
        { imageUrl: "https://cdn.example.com/orphan.jpg" },
      ]),
    ).toEqual([
      {
        categoryId: FIXTURE_CATEGORY_ID,
        imageUrl: "https://cdn.example.com/preview.jpg",
      },
    ]);
  });
});
