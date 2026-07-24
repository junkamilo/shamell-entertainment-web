import { describe, expect, it } from "vitest";
import {
  formatStandaloneChairAdminSubtitle,
  formatStandaloneChairShortId,
  mapStandaloneChairFromApi,
} from "./mapStandaloneChairFromApi";
import {
  FIXTURE_CHAIR_CONFIG_ID,
  FIXTURE_CHAIR_ID,
} from "../test/fixtures/uuids.fixture";
import { makeStandaloneChairConfig } from "../test/fixtures/venueTables.fixture";

describe("mapStandaloneChairFromApi", () => {
  it("maps a full config with chairs", () => {
    const api = makeStandaloneChairConfig();
    const result = mapStandaloneChairFromApi(api);
    expect(result.id).toBe(FIXTURE_CHAIR_CONFIG_ID);
    expect(result.chairs).toHaveLength(2);
    expect(result.chairs?.[0]?.id).toBe(FIXTURE_CHAIR_ID);
    expect(result.reservedCount).toBe(1);
  });

  it("returns default empty config for invalid input", () => {
    expect(mapStandaloneChairFromApi(null)).toEqual({
      id: null,
      availableQuantity: 0,
      unitPrice: 0,
      updatedAt: null,
      isDefault: true,
      reservedCount: 0,
      totalCount: 0,
      chairs: [],
    });
  });

  it("derives chairName from id when missing", () => {
    const result = mapStandaloneChairFromApi({
      id: FIXTURE_CHAIR_CONFIG_ID,
      availableQuantity: 1,
      unitPrice: 35,
      chairs: [{ id: FIXTURE_CHAIR_ID, unitPrice: 35 }],
    });
    expect(result.chairs?.[0]?.chairName).toMatch(/^CHAIR-/);
  });

  it("formatStandaloneChairShortId shortens uuid", () => {
    expect(formatStandaloneChairShortId(FIXTURE_CHAIR_ID)).toBe("#ch1111");
  });

  it("formatStandaloneChairAdminSubtitle includes price and id", () => {
    expect(
      formatStandaloneChairAdminSubtitle({ id: FIXTURE_CHAIR_ID, unitPrice: 35 }),
    ).toBe("$35 each · #ch1111");
  });
});
