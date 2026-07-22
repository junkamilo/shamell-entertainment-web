import type { OccasionTypeItem } from "../types/occasionTypes.types";

export function buildOccasionTypeSubtitle(item: OccasionTypeItem): string {
  const bk = item.bookingCount ?? 0;
  const links = item.eventTypeLinkCount ?? 0;

  if (bk > 0) {
    const bookingPart =
      bk === 1 ? "1 linked booking" : `${bk} linked bookings`;
    const linkPart =
      links > 0
        ? links === 1
          ? " · 1 event type linked"
          : ` · ${links} event types linked`
        : "";
    return `${bookingPart}${linkPart}. Deactivate and delete are blocked until those bookings are resolved.`;
  }

  if (links > 0) {
    return links === 1
      ? "1 event type linked. You can hide or delete if you do not need it."
      : `${links} event types linked. You can hide or delete if you do not need it.`;
  }

  return "No linked event types or bookings.";
}
