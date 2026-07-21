import type { AdminBookingRow } from "@/hooks/use-admin-bookings";
import {
  hhmmFromBookingDate,
  isoDateFromInstantInTimeZone,
} from "@/app/shamell-admin/agenda/peticiones/lib/peticionesDateUtils";
import type { AgendarFormState } from "../types/agendarFormState.types";

function serviceIdsFromBooking(row: AdminBookingRow): string[] {
  if (Array.isArray(row.bookingServices) && row.bookingServices.length > 0) {
    return row.bookingServices
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((entry) => entry.serviceId || entry.service?.id || "")
      .filter(Boolean);
  }

  const details =
    row.bookingDetails && typeof row.bookingDetails === "object"
      ? (row.bookingDetails as Record<string, unknown>)
      : {};
  const raw = details.serviceIds;
  if (Array.isArray(raw)) {
    const ids = raw
      .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      .map((id) => id.trim());
    if (ids.length > 0) return ids;
  }
  if (row.service?.id) return [row.service.id];
  return [];
}

function timeFromDetails(
  row: AdminBookingRow,
  tz: string,
  field: "eventTimeStart" | "eventTimeEnd",
): string {
  const details =
    row.bookingDetails && typeof row.bookingDetails === "object"
      ? (row.bookingDetails as Record<string, unknown>)
      : {};
  const value = details[field];
  if (typeof value === "string" && /^\d{2}:\d{2}$/.test(value)) return value;
  return hhmmFromBookingDate(row.eventDate, tz);
}

export function applyBookingRowToAgendarForm(
  row: AdminBookingRow,
  form: AgendarFormState,
  tz: string,
) {
  const serviceIds = serviceIdsFromBooking(row);
  if (serviceIds.length > 0) form.setServiceIds(serviceIds);
  if (row.eventType?.id) form.setEventTypeId(row.eventType.id);
  if (row.occasionType?.id) form.setOccasionTypeId(row.occasionType.id);
  if (row.eventDate) {
    form.setEventDateIso(isoDateFromInstantInTimeZone(row.eventDate, tz));
  }
  form.setEventTimeStart(timeFromDetails(row, tz, "eventTimeStart"));
  form.setEventTimeEnd(timeFromDetails(row, tz, "eventTimeEnd"));
  if (row.location) form.setLocation(row.location.trim());
  const fullName = row.user?.fullName || row.guestFullName || "";
  const email = row.user?.email || row.guestEmail || "";
  const phone = row.guestPhone || "";
  if (fullName) form.setGuestFullName(fullName);
  if (email) form.setGuestEmail(email.trim().toLowerCase());
  if (phone) form.setGuestPhone(phone);
  if (row.guestCount != null && row.guestCount > 0) {
    form.setGuestCount(String(row.guestCount));
  }
  if (row.notes) form.setNotes(row.notes);
  if (row.contactRequestId) form.setLinkedContactRequestId(row.contactRequestId);
}
