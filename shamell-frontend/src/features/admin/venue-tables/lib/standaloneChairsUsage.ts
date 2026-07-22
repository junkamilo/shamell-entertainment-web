import type { StandaloneChairInventoryItem } from "../types/standaloneChairs.types";

export function canDeleteStandaloneChair(item: StandaloneChairInventoryItem) {
  return item.canDelete;
}

export function canEditStandaloneChairPrice(item: StandaloneChairInventoryItem) {
  return item.canEditPrice;
}

export function canDeleteAllStandaloneChairs(reservedCount: number) {
  return reservedCount === 0;
}

export function canBulkEditStandaloneChairPrices(reservedCount: number) {
  return reservedCount === 0;
}

export function getDeleteBlockedDescription(item: StandaloneChairInventoryItem): string {
  if (item.reservationStatus === "PAID") {
    return "This chair has a paid reservation. Cancel or complete the reservation in Seat Reservations before deleting it.";
  }
  return "This chair has an active pending payment. Wait for it to expire or cancel it in Seat Reservations before deleting.";
}

export function getEditPriceBlockedDescription(item: StandaloneChairInventoryItem): string {
  if (item.reservationStatus === "PAID") {
    return "This chair has a paid reservation. You cannot change its price until the reservation is cancelled.";
  }
  return "This chair has an active pending payment. You cannot change its price until the checkout expires or is cancelled.";
}

export function getDeleteAllBlockedDescription(reservedCount: number): string {
  return `${reservedCount} chair${reservedCount === 1 ? " has" : "s have"} active reservations. Remove or cancel those reservations before deleting all chairs.`;
}

export function getBulkEditPriceBlockedDescription(reservedCount: number): string {
  return `${reservedCount} chair${reservedCount === 1 ? " has" : "s have"} active reservations. You can only edit all prices when no chairs are reserved.`;
}
