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

function describeBlockingLinks(item: EventTypeItem): string {
  const parts: string[] = [];
  const ev = item.eventCount ?? 0;
  const bk = item.bookingCount ?? 0;
  const gal = item.galleryPhotoCount ?? 0;

  if (ev > 0) parts.push(ev === 1 ? "1 catalog event" : `${ev} catalog events`);
  if (bk > 0) parts.push(bk === 1 ? "1 booking" : `${bk} bookings`);
  if (gal > 0) parts.push(gal === 1 ? "1 gallery photo" : `${gal} gallery photos`);

  if (parts.length === 1) return parts[0]!;
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

export function getDeactivateBlockedDescription(item: EventTypeItem): string {
  return `This event type has ${describeBlockingLinks(item)} linked. Remove or reassign those records before you can turn this type off.`;
}

export function getDeleteBlockedDescription(item: EventTypeItem): string {
  return `This event type has ${describeBlockingLinks(item)} linked. Remove or reassign those records before you can delete it.`;
}
