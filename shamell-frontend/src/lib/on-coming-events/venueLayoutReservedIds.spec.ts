import { describe, expect, it } from "vitest";
import {
  makeCatalogTableItem,
  makeStandaloneChairItem,
} from "./test/fixtures/onComingEventsLib.fixture";
import {
  FIXTURE_LAYOUT_ITEM_ID,
  FIXTURE_LAYOUT_ITEM_ID_2,
  FIXTURE_TABLE_CONFIG_ID,
} from "./test/fixtures/uuids.fixture";
import { buildReservedLayoutItemIdSet } from "./venueLayoutReservedIds";
import type { LayoutItemLabel } from "./venueSeatDisplayLabel";

describe("buildReservedLayoutItemIdSet", () => {
  const items = [makeCatalogTableItem(), makeStandaloneChairItem()];

  it("includes explicit reserved layout item ids", () => {
    const reserved = buildReservedLayoutItemIdSet(items, [
      FIXTURE_LAYOUT_ITEM_ID,
      "",
    ]);
    expect(reserved.has(FIXTURE_LAYOUT_ITEM_ID)).toBe(true);
    expect(reserved.has(FIXTURE_LAYOUT_ITEM_ID_2)).toBe(false);
  });

  it("matches catalog tables by venueTableConfigId", () => {
    const reserved = buildReservedLayoutItemIdSet(
      items,
      [],
      [FIXTURE_TABLE_CONFIG_ID],
    );
    expect(reserved.has(FIXTURE_LAYOUT_ITEM_ID)).toBe(true);
  });

  it("matches by short display labels when provided", () => {
    const labels = new Map<string, LayoutItemLabel>([
      [FIXTURE_LAYOUT_ITEM_ID, { short: "Large 1", full: "Large table 1" }],
      [FIXTURE_LAYOUT_ITEM_ID_2, { short: "Chair 1", full: "Chair 1" }],
    ]);
    const reserved = buildReservedLayoutItemIdSet(
      items,
      [],
      [],
      labels,
      [" large 1 ", "Chair 1"],
    );
    expect(reserved.has(FIXTURE_LAYOUT_ITEM_ID)).toBe(true);
    expect(reserved.has(FIXTURE_LAYOUT_ITEM_ID_2)).toBe(true);
  });

  it("ignores short-label matching without a label map", () => {
    const reserved = buildReservedLayoutItemIdSet(
      items,
      [],
      [],
      undefined,
      ["Large 1"],
    );
    expect(reserved.size).toBe(0);
  });
});
