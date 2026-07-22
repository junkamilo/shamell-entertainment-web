import { TYPE_ICONS } from "./eventTypesConstants";

export function iconIndexForTypeName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % TYPE_ICONS.length;
}

export function iconForTypeName(name: string) {
  return TYPE_ICONS[iconIndexForTypeName(name)];
}

export function formatRelativeEn(iso: string | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 45) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

export function buildEventTypeUsageLine(item: {
  eventCount?: number;
  bookingCount?: number;
  galleryPhotoCount?: number;
}): string {
  const nEvents = item.eventCount ?? 0;
  const nBk = item.bookingCount ?? 0;
  const nGal = item.galleryPhotoCount ?? 0;
  const catalogLabel = nEvents === 1 ? "1 catalog event" : `${nEvents} catalog events`;
  const extraParts: string[] = [];
  if (nBk > 0) extraParts.push(nBk === 1 ? "1 booking" : `${nBk} bookings`);
  if (nGal > 0) extraParts.push(nGal === 1 ? "1 gallery photo" : `${nGal} gallery photos`);
  return extraParts.length ? `${catalogLabel} · ${extraParts.join(" · ")}` : catalogLabel;
}

export function buildEventTypeSubtitle(item: {
  eventCount?: number;
  bookingCount?: number;
  galleryPhotoCount?: number;
  occasionAssignments?: { occasionTypeId: string; occasionName?: string }[];
}): string {
  const nEvents = item.eventCount ?? 0;
  const nBk = item.bookingCount ?? 0;
  const nGal = item.galleryPhotoCount ?? 0;
  const usage = buildEventTypeUsageLine(item);
  const occasions = formatLinkedOccasionSummary(item.occasionAssignments);

  if (nEvents > 0 || nBk > 0 || nGal > 0) {
    const occPart = occasions ? ` · ${occasions}` : "";
    return `${usage}${occPart}. Deactivate and delete are blocked until those links are removed.`;
  }

  if (occasions) {
    return `${occasions} linked as contact options.`;
  }

  return "No linked catalog events or occasions.";
}

function formatLinkedOccasionSummary(
  assignments: { occasionTypeId: string; occasionName?: string }[] | undefined,
): string | null {
  if (!assignments?.length) return null;
  const seen = new Set<string>();
  let count = 0;
  for (const a of assignments) {
    if (seen.has(a.occasionTypeId)) continue;
    seen.add(a.occasionTypeId);
    count += 1;
  }
  if (count === 0) return null;
  return count === 1 ? "1 occasion type" : `${count} occasion types`;
}
