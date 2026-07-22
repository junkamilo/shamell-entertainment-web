import type { OccasionTypeItem } from "../types/occasionTypes.types";

export function canDeleteOccasionType(item: OccasionTypeItem) {
  return (item.bookingCount ?? 0) === 0;
}

export function cannotDeactivateWhileActive(item: OccasionTypeItem) {
  return item.isActive && (item.bookingCount ?? 0) > 0;
}

export function getDeactivateBlockedDescription(item: OccasionTypeItem): string {
  const bk = item.bookingCount ?? 0;
  if (bk === 1) {
    return "This occasion type has 1 linked booking. Resolve or remove that booking before you can turn this type off.";
  }
  return `This occasion type has ${bk} linked bookings. Resolve or remove those bookings before you can turn this type off.`;
}

export function getDeleteBlockedDescription(item: OccasionTypeItem): string {
  const bk = item.bookingCount ?? 0;
  if (bk === 1) {
    return "This occasion type has 1 linked booking. Resolve or remove that booking before you can delete it.";
  }
  return `This occasion type has ${bk} linked bookings. Resolve or remove those bookings before you can delete it.`;
}
