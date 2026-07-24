import { describe, expect, it } from "vitest";
import { FIXTURE_HEADER_PHOTO_ID } from "../test/fixtures/uuids.fixture";
import { mapHeaderPhotoFromApi, mapHeaderPhotosFromApi } from "./mapHeaderPhotoFromApi";

describe("mapHeaderPhotoFromApi", () => {
  it("maps a full row", () => {
    expect(
      mapHeaderPhotoFromApi({
        id: FIXTURE_HEADER_PHOTO_ID,
        imageUrl: "https://cdn.example.com/header/photo.jpg",
        mediaType: "IMAGE",
        focalX: 40,
        focalY: 30,
        focalMobileX: 45,
        focalMobileY: 25,
        isActive: true,
        createdAt: "2026-07-20T12:00:00.000Z",
        updatedAt: "2026-07-20T12:00:00.000Z",
      }),
    ).toEqual({
      id: FIXTURE_HEADER_PHOTO_ID,
      imageUrl: "https://cdn.example.com/header/photo.jpg",
      mediaType: "IMAGE",
      focalX: 40,
      focalY: 30,
      focalMobileX: 45,
      focalMobileY: 25,
      isActive: true,
      createdAt: "2026-07-20T12:00:00.000Z",
      updatedAt: "2026-07-20T12:00:00.000Z",
    });
  });

  it("applies defaults and clamps invalid focals", () => {
    expect(
      mapHeaderPhotoFromApi({
        id: FIXTURE_HEADER_PHOTO_ID,
        focalX: 200,
        focalY: "bad",
      }),
    ).toMatchObject({
      id: FIXTURE_HEADER_PHOTO_ID,
      imageUrl: "",
      mediaType: undefined,
      focalX: 100,
      focalY: 50,
      isActive: false,
    });
  });

  it("mapHeaderPhotosFromApi returns empty for non-arrays", () => {
    expect(mapHeaderPhotosFromApi(null)).toEqual([]);
  });

  it("mapHeaderPhotosFromApi maps an array", () => {
    const result = mapHeaderPhotosFromApi([
      { id: FIXTURE_HEADER_PHOTO_ID, imageUrl: "https://cdn.example.com/a.jpg" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(FIXTURE_HEADER_PHOTO_ID);
  });
});
