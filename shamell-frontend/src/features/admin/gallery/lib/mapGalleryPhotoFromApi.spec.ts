import { describe, expect, it } from "vitest";
import {
  FIXTURE_CATEGORY_ID,
  FIXTURE_PHOTO_ID,
} from "../test/fixtures/uuids.fixture";
import {
  mapGalleryPhotoFromApi,
  mapGalleryPhotosFromApi,
} from "./mapGalleryPhotoFromApi";

describe("mapGalleryPhotoFromApi", () => {
  it("maps a full row", () => {
    expect(
      mapGalleryPhotoFromApi({
        id: FIXTURE_PHOTO_ID,
        imageUrl: "https://cdn.example.com/gallery/photo.jpg",
        isActive: true,
        mediaType: "IMAGE",
        createdAt: "2026-07-20T12:00:00.000Z",
        updatedAt: "2026-07-20T12:00:00.000Z",
        category: {
          id: FIXTURE_CATEGORY_ID,
          name: "Weddings",
          slug: "weddings",
        },
      }),
    ).toEqual({
      id: FIXTURE_PHOTO_ID,
      imageUrl: "https://cdn.example.com/gallery/photo.jpg",
      isActive: true,
      mediaType: "IMAGE",
      createdAt: "2026-07-20T12:00:00.000Z",
      updatedAt: "2026-07-20T12:00:00.000Z",
      category: {
        id: FIXTURE_CATEGORY_ID,
        name: "Weddings",
        slug: "weddings",
      },
    });
  });

  it("applies defaults for missing fields", () => {
    expect(mapGalleryPhotoFromApi({ id: FIXTURE_PHOTO_ID })).toEqual({
      id: FIXTURE_PHOTO_ID,
      imageUrl: "",
      isActive: false,
      mediaType: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      category: { id: "", name: "", slug: "" },
    });
  });

  it("mapGalleryPhotosFromApi returns empty for non-arrays", () => {
    expect(mapGalleryPhotosFromApi(null)).toEqual([]);
    expect(mapGalleryPhotosFromApi({})).toEqual([]);
  });

  it("mapGalleryPhotosFromApi maps an array", () => {
    const result = mapGalleryPhotosFromApi([
      { id: FIXTURE_PHOTO_ID, imageUrl: "https://cdn.example.com/a.jpg", isActive: true },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(FIXTURE_PHOTO_ID);
  });
});
