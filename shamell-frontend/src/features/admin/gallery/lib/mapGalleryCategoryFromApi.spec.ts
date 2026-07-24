import { describe, expect, it } from "vitest";
import { FIXTURE_CATEGORY_ID } from "../test/fixtures/uuids.fixture";
import {
  mapGalleryCategoriesFromApi,
  mapGalleryCategoryFromApi,
} from "./mapGalleryCategoryFromApi";

describe("mapGalleryCategoryFromApi", () => {
  it("maps a full row", () => {
    expect(
      mapGalleryCategoryFromApi({
        id: FIXTURE_CATEGORY_ID,
        name: "Weddings",
        slug: "weddings",
        isActive: true,
        createdAt: "2026-07-20T12:00:00.000Z",
        updatedAt: "2026-07-20T12:00:00.000Z",
      }),
    ).toEqual({
      id: FIXTURE_CATEGORY_ID,
      name: "Weddings",
      slug: "weddings",
      isActive: true,
      createdAt: "2026-07-20T12:00:00.000Z",
      updatedAt: "2026-07-20T12:00:00.000Z",
    });
  });

  it("applies defaults for missing fields", () => {
    expect(mapGalleryCategoryFromApi({ id: FIXTURE_CATEGORY_ID })).toEqual({
      id: FIXTURE_CATEGORY_ID,
      name: "",
      slug: "",
      isActive: false,
      createdAt: undefined,
      updatedAt: undefined,
    });
  });

  it("mapGalleryCategoriesFromApi returns empty for non-arrays", () => {
    expect(mapGalleryCategoriesFromApi(null)).toEqual([]);
  });

  it("mapGalleryCategoriesFromApi maps an array", () => {
    const result = mapGalleryCategoriesFromApi([
      { id: FIXTURE_CATEGORY_ID, name: "Weddings", slug: "weddings", isActive: true },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(FIXTURE_CATEGORY_ID);
  });
});
