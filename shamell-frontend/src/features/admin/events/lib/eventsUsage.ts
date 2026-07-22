import type { AdminEvent } from "../types/events.types";

/** Catalog images are removed automatically on delete; only bookings block the UI. */
export function canDeleteEvent(item: AdminEvent) {
  return (item.bookingCount ?? 0) === 0;
}

export function deleteBlockedReason(item: AdminEvent): string | null {
  if ((item.bookingCount ?? 0) > 0) {
    return getDeleteBlockedDescription(item);
  }
  return null;
}

export function cannotDeactivateWhileActive(item: AdminEvent) {
  return item.isActive && (item.bookingCount ?? 0) > 0;
}

export function getDeactivateBlockedDescription(item: AdminEvent): string {
  const bk = item.bookingCount ?? 0;
  if (bk === 1) {
    return "This event has 1 linked booking. Resolve or remove that booking before you can turn this event off.";
  }
  return `This event has ${bk} linked bookings. Resolve or remove those bookings before you can turn this event off.`;
}

export function getDeleteBlockedDescription(item: AdminEvent): string {
  const bk = item.bookingCount ?? 0;
  if (bk === 1) {
    return "This event has 1 linked booking. Resolve or remove that booking before you can delete it.";
  }
  return `This event has ${bk} linked bookings. Resolve or remove those bookings before you can delete it.`;
}
