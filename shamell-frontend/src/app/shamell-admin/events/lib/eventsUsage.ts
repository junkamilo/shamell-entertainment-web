import type { AdminEvent } from "../types/events.types";

export function canDeleteEvent(item: AdminEvent) {
  return (item.bookingCount ?? 0) === 0 && (item.galleryPhotoCount ?? 0) === 0;
}

export function cannotDeactivateWhileActive(item: AdminEvent) {
  return item.isActive && (item.bookingCount ?? 0) > 0;
}
