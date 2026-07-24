import { describe, expect, it } from "vitest";
import { FIXTURE_SERVICE_TYPE_ID } from "../test/fixtures/uuids.fixture";
import {
  mapServiceTypeFromApi,
  mapServiceTypesFromApi,
} from "./mapServiceTypeFromApi";

describe("mapServiceTypeFromApi", () => {
  it("maps a full row", () => {
    expect(
      mapServiceTypeFromApi({
        id: FIXTURE_SERVICE_TYPE_ID,
        name: "Performance",
        isActive: true,
        createdAt: "2026-07-20T12:00:00.000Z",
        updatedAt: "2026-07-20T12:00:00.000Z",
        serviceCount: 2,
        galleryPhotoCount: 1,
      }),
    ).toEqual({
      id: FIXTURE_SERVICE_TYPE_ID,
      name: "Performance",
      isActive: true,
      createdAt: "2026-07-20T12:00:00.000Z",
      updatedAt: "2026-07-20T12:00:00.000Z",
      serviceCount: 2,
      galleryPhotoCount: 1,
    });
  });

  it("applies defaults for missing fields", () => {
    expect(mapServiceTypeFromApi({ id: FIXTURE_SERVICE_TYPE_ID })).toEqual({
      id: FIXTURE_SERVICE_TYPE_ID,
      name: "undefined",
      isActive: false,
      createdAt: undefined,
      updatedAt: undefined,
      serviceCount: 0,
      galleryPhotoCount: 0,
    });
  });

  it("mapServiceTypesFromApi returns empty for non-arrays", () => {
    expect(mapServiceTypesFromApi(null)).toEqual([]);
  });

  it("mapServiceTypesFromApi maps an array", () => {
    const result = mapServiceTypesFromApi([
      { id: FIXTURE_SERVICE_TYPE_ID, name: "Performance", isActive: true },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(FIXTURE_SERVICE_TYPE_ID);
  });
});
