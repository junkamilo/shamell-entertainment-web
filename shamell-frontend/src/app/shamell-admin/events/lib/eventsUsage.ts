import type { AdminEvent } from "../types/events.types";

/** Catalog images are removed automatically on delete; only bookings block the UI. */
export function canDeleteEvent(item: AdminEvent) {
  return (item.bookingCount ?? 0) === 0;
}

export function deleteBlockedReason(item: AdminEvent): string | null {
  if ((item.bookingCount ?? 0) > 0) {
    return "This event has linked bookings.";
  }
  return null;
}

export function cannotDeactivateWhileActive(item: AdminEvent) {
  return item.isActive && (item.bookingCount ?? 0) > 0;
}
