import type { AdminService } from "../types/services.types";

export function canDeleteService(service: AdminService) {
  return (service.bookingCount ?? 0) === 0 && (service.galleryPhotoCount ?? 0) === 0;
}

export function cannotDeactivateWhileActive(service: AdminService) {
  return service.isActive && (service.bookingCount ?? 0) > 0;
}

export function getDeactivateBlockedDescription(service: AdminService): string {
  const bk = service.bookingCount ?? 0;
  if (bk === 1) {
    return "This service has 1 linked booking. Resolve or reassign that booking before you can turn this service off.";
  }
  return `This service has ${bk} linked bookings. Resolve or reassign those bookings before you can turn this service off.`;
}

export function getDeleteBlockedDescription(service: AdminService): string {
  const bk = service.bookingCount ?? 0;
  const gal = service.galleryPhotoCount ?? 0;

  if (bk > 0 && gal > 0) {
    return `This service has ${bk} linked booking${bk === 1 ? "" : "s"} and ${gal} linked gallery photo${gal === 1 ? "" : "s"}. Remove those links before you can delete it.`;
  }
  if (bk > 0) {
    if (bk === 1) {
      return "This service has 1 linked booking. Resolve or remove that booking before you can delete this service.";
    }
    return `This service has ${bk} linked bookings. Resolve or remove those bookings before you can delete this service.`;
  }
  if (gal > 0) {
    if (gal === 1) {
      return "This service has 1 linked gallery photo. Unlink or remove that photo before you can delete this service.";
    }
    return `This service has ${gal} linked gallery photos. Unlink or remove those photos before you can delete this service.`;
  }
  return "This service cannot be deleted while it still has linked records.";
}

export function getDeleteBlockedTitle(service: AdminService): string {
  return (service.bookingCount ?? 0) > 0 ? "Has linked bookings" : "Has linked gallery photos";
}
