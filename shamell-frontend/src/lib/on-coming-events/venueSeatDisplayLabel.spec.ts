import { describe, expect, it } from "vitest";
import {
  makeCatalogTableItem,
  makeChairCatalogPeers,
  makeChairCatalogRow,
  makeStandaloneChairItem,
  makeTableCatalogPeers,
  makeTableCatalogRow,
} from "./test/fixtures/onComingEventsLib.fixture";
import {
  FIXTURE_CHAIR_ID,
  FIXTURE_LAYOUT_ITEM_ID,
  FIXTURE_LAYOUT_ITEM_ID_2,
  FIXTURE_TABLE_CONFIG_ID,
} from "./test/fixtures/uuids.fixture";
import {
  buildLayoutItemLabelMap,
  formatChairDisplayLabel,
  formatTableDisplayLabel,
  formatTableShortLabel,
  isTechnicalChairName,
  isTechnicalTableName,
  ordinalFromOrderedIds,
  resolveChairDisplayLabels,
  resolveTableDisplayLabels,
  shouldUseChairOrdinalLabel,
  shouldUseTableOrdinalLabel,
} from "./venueSeatDisplayLabel";

describe("technical name helpers", () => {
  it("detects technical table and chair names", () => {
    expect(isTechnicalTableName("LARGE-aaaaaaaa")).toBe(true);
    expect(isTechnicalTableName("VIP Booth")).toBe(false);
    expect(isTechnicalChairName("CHAIR-aaaaaaaa")).toBe(true);
    expect(isTechnicalChairName("Window seat")).toBe(false);
  });
});

describe("ordinal label decisions", () => {
  it("uses ordinal for empty, technical, and size-label table names", () => {
    expect(shouldUseTableOrdinalLabel("", "LARGE")).toBe(true);
    expect(shouldUseTableOrdinalLabel("LARGE-aaaaaaaa", "LARGE")).toBe(true);
    expect(shouldUseTableOrdinalLabel("Large", "LARGE")).toBe(true);
    expect(shouldUseTableOrdinalLabel("Large table", "LARGE")).toBe(true);
    expect(shouldUseTableOrdinalLabel("large", "LARGE")).toBe(true);
    expect(shouldUseTableOrdinalLabel("VIP Booth", "LARGE")).toBe(false);
  });

  it("uses ordinal for default chair names", () => {
    expect(shouldUseChairOrdinalLabel("")).toBe(true);
    expect(shouldUseChairOrdinalLabel("CHAIR-aaaaaaaa")).toBe(true);
    expect(shouldUseChairOrdinalLabel("Chair")).toBe(true);
    expect(shouldUseChairOrdinalLabel("Standalone Chair")).toBe(true);
    expect(shouldUseChairOrdinalLabel("Window")).toBe(false);
  });
});

describe("format and ordinal helpers", () => {
  it("formats table and chair labels", () => {
    expect(formatTableDisplayLabel("LARGE", 2)).toBe("Large table 2");
    expect(formatTableShortLabel("MEDIUM", 1)).toBe("Medium 1");
    expect(formatChairDisplayLabel(3)).toBe("Chair 3");
  });

  it("resolves ordinal from ordered ids", () => {
    expect(ordinalFromOrderedIds(["a", "b", "c"], "b")).toBe(2);
    expect(ordinalFromOrderedIds(["a", "b"], "missing")).toBe(1);
  });
});

describe("resolveTableDisplayLabels / resolveChairDisplayLabels", () => {
  it("returns custom names when not ordinal-eligible", () => {
    const table = makeTableCatalogRow({ tableName: "VIP Booth" });
    expect(resolveTableDisplayLabels(table, [table])).toEqual({
      short: "VIP Booth",
      full: "VIP Booth",
    });

    const chair = makeChairCatalogRow({ chairName: "Window" });
    expect(resolveChairDisplayLabels(chair, [chair])).toEqual({
      short: "Window",
      full: "Window",
    });
  });

  it("returns ordinal labels among active peers", () => {
    const peers = makeTableCatalogPeers();
    expect(resolveTableDisplayLabels(peers[0]!, peers)).toEqual({
      short: "Large 1",
      full: "Large table 1",
    });

    const chairs = makeChairCatalogPeers();
    expect(resolveChairDisplayLabels(chairs[0]!, chairs)).toEqual({
      short: "Chair 1",
      full: "Chair 1",
    });
  });
});

describe("buildLayoutItemLabelMap", () => {
  it("maps catalog tables and standalone chairs to display labels", () => {
    const items = [makeCatalogTableItem(), makeStandaloneChairItem()];
    const map = buildLayoutItemLabelMap(
      items,
      makeTableCatalogPeers(),
      makeChairCatalogPeers(),
    );

    expect(map.get(FIXTURE_LAYOUT_ITEM_ID)).toEqual({
      short: "Large 1",
      full: "Large table 1",
    });
    expect(map.get(FIXTURE_LAYOUT_ITEM_ID_2)).toEqual({
      short: "Chair 1",
      full: "Chair 1",
    });
  });

  it("uses custom catalog names when present", () => {
    const items = [
      makeCatalogTableItem({
        venueTableConfigId: FIXTURE_TABLE_CONFIG_ID,
      }),
      makeStandaloneChairItem({
        venueStandaloneChairId: FIXTURE_CHAIR_ID,
      }),
    ];
    const map = buildLayoutItemLabelMap(
      items,
      [makeTableCatalogRow({ tableName: "VIP Booth" })],
      [makeChairCatalogRow({ chairName: "Window" })],
    );

    expect(map.get(FIXTURE_LAYOUT_ITEM_ID)).toEqual({
      short: "VIP Booth",
      full: "VIP Booth",
    });
    expect(map.get(FIXTURE_LAYOUT_ITEM_ID_2)).toEqual({
      short: "Window",
      full: "Window",
    });
  });

  it("synthesizes catalog rows for layout items missing from catalogs", () => {
    const orphanTableId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const orphanChairId = "ffffffff-aaaa-4bbb-8ccc-dddddddddddd";
    const items = [
      makeCatalogTableItem({
        id: "li-orphan-table",
        venueTableConfigId: orphanTableId,
        tableName: "LARGE-cccccccc",
      }),
      makeStandaloneChairItem({
        id: "li-orphan-chair",
        venueStandaloneChairId: orphanChairId,
      }),
    ];
    const map = buildLayoutItemLabelMap(items, [], []);

    expect(map.get("li-orphan-table")).toEqual({
      short: "Large 1",
      full: "Large table 1",
    });
    expect(map.get("li-orphan-chair")).toEqual({
      short: "Chair 1",
      full: "Chair 1",
    });
  });
});
