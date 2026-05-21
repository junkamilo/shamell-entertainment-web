import type { AdminService } from "../types/services.types";

export function canDeleteService(service: AdminService) {
  return (service.bookingCount ?? 0) === 0 && (service.galleryPhotoCount ?? 0) === 0;
}

export function cannotDeactivateWhileActive(service: AdminService) {
  return service.isActive && (service.bookingCount ?? 0) > 0;
}

export function getDeleteBlockedDescription(service: AdminService): string {
  if ((service.bookingCount ?? 0) > 0) {
    return "This service has linked bookings.";
  }
  return "There are gallery photos linked to this service.";
}

export function getDeleteBlockedTitle(service: AdminService): string {
  return (service.bookingCount ?? 0) > 0 ? "Has linked bookings" : "Has linked gallery photos";
}
