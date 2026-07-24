import { describe, expect, it } from "vitest";
import {
  mapVenueTableFromApi,
  mapVenueTablesListFromApi,
} from "./mapVenueTableFromApi";
import { FIXTURE_TABLE_ID } from "../test/fixtures/uuids.fixture";
import { makeVenueTable } from "../test/fixtures/venueTables.fixture";

describe("mapVenueTableFromApi", () => {
  it("maps a full row", () => {
    const table = makeVenueTable();
    expect(mapVenueTableFromApi(table)).toEqual({
      id: FIXTURE_TABLE_ID,
      tableName: "Large 1",
      displayLabel: "Large 1",
      size: "LARGE",
      includedChairs: 8,
      bundlePrice: 250,
      visualCoordinates: null,
      isActive: true,
      sortOrder: 0,
      createdAt: "2026-07-20T12:00:00.000Z",
      updatedAt: "2026-07-20T12:00:00.000Z",
    });
  });

  it("maps visual coordinates when present", () => {
    const result = mapVenueTableFromApi({
      id: FIXTURE_TABLE_ID,
      tableName: "Large 1",
      visualCoordinates: { x: 12, y: 34 },
    });
    expect(result?.visualCoordinates).toEqual({ x: 12, y: 34 });
  });

  it("returns null for invalid input", () => {
    expect(mapVenueTableFromApi(null)).toBeNull();
    expect(mapVenueTableFromApi({ id: FIXTURE_TABLE_ID })).toBeNull();
  });

  it("mapVenueTablesListFromApi returns empty for non-arrays", () => {
    expect(mapVenueTablesListFromApi(null)).toEqual([]);
  });

  it("mapVenueTablesListFromApi maps valid rows only", () => {
    const result = mapVenueTablesListFromApi([
      makeVenueTable(),
      { bad: true },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(FIXTURE_TABLE_ID);
  });
});
