import { describe, expect, it } from "vitest";
import { FIXTURE_OCCASION_TYPE_ID } from "../test/fixtures/uuids.fixture";
import {
  mapOccasionTypeFromApi,
  mapOccasionTypesFromApi,
} from "./mapOccasionTypeFromApi";

describe("mapOccasionTypeFromApi", () => {
  it("maps a full row", () => {
    expect(
      mapOccasionTypeFromApi({
        id: FIXTURE_OCCASION_TYPE_ID,
        name: "Birthday",
        isActive: true,
        createdAt: "2026-07-20T12:00:00.000Z",
        updatedAt: "2026-07-20T12:00:00.000Z",
        bookingCount: 2,
        eventTypeLinkCount: 1,
      }),
    ).toEqual({
      id: FIXTURE_OCCASION_TYPE_ID,
      name: "Birthday",
      isActive: true,
      createdAt: "2026-07-20T12:00:00.000Z",
      updatedAt: "2026-07-20T12:00:00.000Z",
      bookingCount: 2,
      eventTypeLinkCount: 1,
    });
  });

  it("applies defaults for missing fields", () => {
    expect(mapOccasionTypeFromApi({ id: FIXTURE_OCCASION_TYPE_ID })).toEqual({
      id: FIXTURE_OCCASION_TYPE_ID,
      name: "",
      isActive: false,
      createdAt: undefined,
      updatedAt: undefined,
      bookingCount: 0,
      eventTypeLinkCount: 0,
    });
  });

  it("mapOccasionTypesFromApi returns empty for non-arrays", () => {
    expect(mapOccasionTypesFromApi(null)).toEqual([]);
  });

  it("mapOccasionTypesFromApi maps an array", () => {
    const result = mapOccasionTypesFromApi([
      { id: FIXTURE_OCCASION_TYPE_ID, name: "Birthday", isActive: true },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(FIXTURE_OCCASION_TYPE_ID);
  });
});
