import { describe, expect, it } from "vitest";
import {
  canBulkEditStandaloneChairPrices,
  canDeleteAllStandaloneChairs,
  canDeleteStandaloneChair,
  canEditStandaloneChairPrice,
  getBulkEditPriceBlockedDescription,
  getDeleteAllBlockedDescription,
  getDeleteBlockedDescription,
  getEditPriceBlockedDescription,
} from "./standaloneChairsUsage";
import { makeStandaloneChairItem } from "../test/fixtures/venueTables.fixture";

describe("standaloneChairsUsage", () => {
  const deletable = makeStandaloneChairItem({ canDelete: true, canEditPrice: true });
  const paidReserved = makeStandaloneChairItem({
    isReserved: true,
    reservationStatus: "PAID",
    canDelete: false,
    canEditPrice: false,
  });
  const pendingReserved = makeStandaloneChairItem({
    isReserved: true,
    reservationStatus: "PENDING_PAYMENT",
    canDelete: false,
    canEditPrice: false,
  });

  it("delegates canDelete and canEdit to item flags", () => {
    expect(canDeleteStandaloneChair(deletable)).toBe(true);
    expect(canEditStandaloneChairPrice(deletable)).toBe(true);
    expect(canDeleteStandaloneChair(paidReserved)).toBe(false);
  });

  it("blocks bulk actions when chairs are reserved", () => {
    expect(canDeleteAllStandaloneChairs(0)).toBe(true);
    expect(canDeleteAllStandaloneChairs(2)).toBe(false);
    expect(canBulkEditStandaloneChairPrices(0)).toBe(true);
    expect(canBulkEditStandaloneChairPrices(1)).toBe(false);
  });

  it("returns paid reservation descriptions", () => {
    expect(getDeleteBlockedDescription(paidReserved)).toMatch(/paid reservation/i);
    expect(getEditPriceBlockedDescription(paidReserved)).toMatch(/paid reservation/i);
  });

  it("returns pending payment descriptions", () => {
    expect(getDeleteBlockedDescription(pendingReserved)).toMatch(/pending payment/i);
    expect(getEditPriceBlockedDescription(pendingReserved)).toMatch(/pending payment/i);
  });

  it("returns bulk blocked descriptions with count", () => {
    expect(getDeleteAllBlockedDescription(1)).toMatch(/1 chair has active reservations/);
    expect(getBulkEditPriceBlockedDescription(2)).toMatch(/2 chairs have active reservations/);
  });
});
