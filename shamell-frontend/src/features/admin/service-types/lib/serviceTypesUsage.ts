import type { ServiceTypeItem } from "../types/serviceTypes.types";

export function canDeleteServiceType(item: ServiceTypeItem) {
  return (item.serviceCount ?? 0) === 0 && (item.galleryPhotoCount ?? 0) === 0;
}

export function cannotDeactivateWhileActive(item: ServiceTypeItem) {
  return item.isActive && (item.serviceCount ?? 0) > 0;
}

export function getDeactivateBlockedDescription(item: ServiceTypeItem): string {
  const svc = item.serviceCount ?? 0;
  if (svc === 1) {
    return "This service type is linked to 1 catalog service. Remove or reassign that service before you can turn this type off.";
  }
  return `This service type is linked to ${svc} catalog services. Remove or reassign those services before you can turn this type off.`;
}

export function getDeleteBlockedDescription(item: ServiceTypeItem): string {
  const svc = item.serviceCount ?? 0;
  const gal = item.galleryPhotoCount ?? 0;

  if (svc > 0 && gal > 0) {
    return `This type is linked to ${svc} catalog service${svc === 1 ? "" : "s"} and ${gal} gallery photo${gal === 1 ? "" : "s"}. Remove or reassign those links before you can delete it.`;
  }
  if (svc > 0) {
    if (svc === 1) {
      return "This type is linked to 1 catalog service. Remove or reassign that service before you can delete this type.";
    }
    return `This type is linked to ${svc} catalog services. Remove or reassign those services before you can delete this type.`;
  }
  if (gal > 0) {
    if (gal === 1) {
      return "This type is linked to 1 gallery photo. Unlink or reassign that photo before you can delete this type.";
    }
    return `This type is linked to ${gal} gallery photos. Unlink or reassign those photos before you can delete this type.`;
  }
  return "This type cannot be deleted while it still has linked records.";
}

export function getDeleteBlockedTitle(item: ServiceTypeItem): string {
  return (item.serviceCount ?? 0) > 0
    ? "Linked services exist"
    : "Linked gallery photos exist";
}
