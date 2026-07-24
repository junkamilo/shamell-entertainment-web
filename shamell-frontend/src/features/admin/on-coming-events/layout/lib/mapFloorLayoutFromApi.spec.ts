import { describe, expect, it } from "vitest";
import {
  mapFloorLayoutFromApi,
  mapFloorLayoutPaletteFromApi,
} from "./mapFloorLayoutFromApi";
import {
  makeFloorLayoutApiPayload,
  makeFloorLayoutPalette,
} from "../../test/fixtures/onComingEvents.fixture";
import {
  FIXTURE_LAYOUT_ID,
  FIXTURE_TABLE_CONFIG_ID,
} from "../../test/fixtures/uuids.fixture";

describe("mapFloorLayoutFromApi", () => {
  it("maps a full layout payload", () => {
    const mapped = mapFloorLayoutFromApi(makeFloorLayoutApiPayload());
    expect(mapped?.id).toBe(FIXTURE_LAYOUT_ID);
    expect(mapped?.items.length).toBe(2);
    expect(mapped?.hasLegacyItems).toBe(false);
  });

  it("flags legacy items and filters them out", () => {
    const mapped = mapFloorLayoutFromApi({
      ...makeFloorLayoutApiPayload(),
      items: [
        { id: "legacy-1", kind: "bench", x: 1, y: 2, rotation: 0 },
        {
          id: "table-1",
          kind: "catalog_table",
          venueTableConfigId: FIXTURE_TABLE_CONFIG_ID,
          tableName: "Large 1",
          size: "LARGE",
          includedChairs: 8,
          x: 10,
          y: 20,
          rotation: 0,
        },
      ],
    });
    expect(mapped?.hasLegacyItems).toBe(true);
    expect(mapped?.items).toHaveLength(1);
  });

  it("returns null for invalid payloads", () => {
    expect(mapFloorLayoutFromApi(null)).toBeNull();
    expect(mapFloorLayoutFromApi({})).toBeNull();
  });
});

describe("mapFloorLayoutPaletteFromApi", () => {
  it("maps palette inventory", () => {
    const mapped = mapFloorLayoutPaletteFromApi(makeFloorLayoutPalette());
    expect(mapped?.tablesBySize.LARGE).toBe(2);
    expect(mapped?.unplacedTables[0]?.id).toBe(FIXTURE_TABLE_CONFIG_ID);
  });

  it("returns null for invalid payloads", () => {
    expect(mapFloorLayoutPaletteFromApi(null)).toBeNull();
  });
});
