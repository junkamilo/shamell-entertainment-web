import { describe, expect, it } from "vitest";
import { mapServiceFromApi, mapServicesFromApi } from "./mapServiceFromApi";
import { FIXTURE_SERVICE_ID, FIXTURE_SERVICE_TYPE_ID } from "../test/fixtures/uuids.fixture";

describe("mapServiceFromApi", () => {
  it("maps a full row and applies defaults for missing fields", () => {
    expect(
      mapServiceFromApi({
        id: FIXTURE_SERVICE_ID,
        serviceTypeId: FIXTURE_SERVICE_TYPE_ID,
        serviceTypeName: "Performance",
        description: "Private show",
        items: ["Dance set"],
        price: 1500,
        imageUrl: "https://cdn.example.com/service.jpg",
        isActive: true,
        bookingCount: 2,
        galleryPhotoCount: 1,
      }),
    ).toEqual({
      id: FIXTURE_SERVICE_ID,
      serviceTypeId: FIXTURE_SERVICE_TYPE_ID,
      serviceTypeName: "Performance",
      description: "Private show",
      items: ["Dance set"],
      price: 1500,
      imageUrl: "https://cdn.example.com/service.jpg",
      isActive: true,
      bookingCount: 2,
      galleryPhotoCount: 1,
    });
  });

  it("defaults missing optional fields", () => {
    expect(mapServiceFromApi({ id: FIXTURE_SERVICE_ID })).toEqual({
      id: FIXTURE_SERVICE_ID,
      serviceTypeId: "",
      serviceTypeName: "",
      description: "",
      items: [],
      price: null,
      imageUrl: null,
      isActive: false,
      bookingCount: 0,
      galleryPhotoCount: 0,
    });
  });

  it("coerces string price and non-array items", () => {
    expect(
      mapServiceFromApi({
        id: FIXTURE_SERVICE_ID,
        price: "99.5",
        items: "not-an-array",
      }),
    ).toMatchObject({
      price: 99.5,
      items: [],
    });
  });
});

describe("mapServicesFromApi", () => {
  it("returns an empty array for non-array payloads", () => {
    expect(mapServicesFromApi(null)).toEqual([]);
    expect(mapServicesFromApi({})).toEqual([]);
    expect(mapServicesFromApi("x")).toEqual([]);
  });

  it("maps each row in an array", () => {
    const result = mapServicesFromApi([{ id: FIXTURE_SERVICE_ID }]);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(FIXTURE_SERVICE_ID);
  });
});
