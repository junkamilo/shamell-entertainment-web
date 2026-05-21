import type { ServiceTypeItem } from "../types/serviceTypes.types";

export function canDeleteServiceType(item: ServiceTypeItem) {
  return (item.serviceCount ?? 0) === 0 && (item.galleryPhotoCount ?? 0) === 0;
}

export function cannotDeactivateWhileActive(item: ServiceTypeItem) {
  return item.isActive && (item.serviceCount ?? 0) > 0;
}

export function getDeleteBlockedDescription(item: ServiceTypeItem): string {
  if ((item.serviceCount ?? 0) > 0) {
    return "Remove or reassign services that use this type before deleting it.";
  }
  return "Remove gallery links or reassign photos that use this type before deleting it.";
}

export function getDeleteBlockedTitle(item: ServiceTypeItem): string {
  return (item.serviceCount ?? 0) > 0
    ? "Linked services exist"
    : "Linked gallery photos exist";
}
