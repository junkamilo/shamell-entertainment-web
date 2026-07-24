import { describe, expect, it } from "vitest";
import { chairCountForItem, totalChairs } from "./floorLayoutStats";
import {
  makeCatalogTableItem,
  makeStandaloneChairItem,
} from "../../test/fixtures/onComingEvents.fixture";

describe("floorLayoutStats", () => {
  it("counts chairs for catalog tables and standalone chairs", () => {
    const table = makeCatalogTableItem({ includedChairs: 8 });
    const chair = makeStandaloneChairItem();
    expect(chairCountForItem(table)).toBe(8);
    expect(chairCountForItem(chair)).toBe(1);
  });

  it("sums total chairs across items", () => {
    expect(
      totalChairs([
        makeCatalogTableItem({ includedChairs: 6 }),
        makeStandaloneChairItem(),
      ]),
    ).toBe(7);
  });
});
