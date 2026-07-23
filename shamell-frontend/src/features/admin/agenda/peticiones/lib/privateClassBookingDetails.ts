/** Helpers for admin private-class bookings stored in `bookingDetails`. */

export function isPrivateClassBookingDetails(raw: unknown): boolean {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  return (raw as { kind?: unknown }).kind === "private_class";
}

export function privateClassTypeFromDetails(raw: unknown): string | null {
  if (!isPrivateClassBookingDetails(raw)) return null;
  const classType = (raw as { classType?: unknown }).classType;
  return typeof classType === "string" && classType.trim()
    ? classType.trim()
    : null;
}
