import type { OccasionTypeItem } from "../types/occasionTypes.types";

export function canDeleteOccasionType(item: OccasionTypeItem) {
  return (item.bookingCount ?? 0) === 0;
}

export function cannotDeactivateWhileActive(item: OccasionTypeItem) {
  return item.isActive && (item.bookingCount ?? 0) > 0;
}
