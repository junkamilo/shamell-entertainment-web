import type { EventTypeItem } from "../types/eventTypes.types";

export function hasBlockingUsage(item: EventTypeItem) {
  return (item.eventCount ?? 0) > 0 || (item.bookingCount ?? 0) > 0 || (item.galleryPhotoCount ?? 0) > 0;
}

export function canDeleteEventType(item: EventTypeItem) {
  return !hasBlockingUsage(item);
}

export function cannotDeactivateWhileActive(item: EventTypeItem) {
  return item.isActive && hasBlockingUsage(item);
}
