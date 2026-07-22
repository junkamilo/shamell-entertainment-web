import type { AdminBookingRow } from "@/hooks/use-admin-bookings";
import { AGENDAR_PATH, AGENDA_PETICIONES_PATH } from "./peticionesRoutes";
import { hhmmFromBookingDate, isoDateFromInstantInTimeZone } from "./peticionesDateUtils";

export function buildBookingEditHref(row: AdminBookingRow, tz: string): string {
  const params = new URLSearchParams();
  const fullName = row.user?.fullName || row.guestFullName || "";
  const email = row.user?.email || row.guestEmail || "";
  const phone = row.guestPhone || "";
  const eventDate = row.eventDate ? isoDateFromInstantInTimeZone(row.eventDate, tz) : "";
  const details =
    row.bookingDetails && typeof row.bookingDetails === "object"
      ? (row.bookingDetails as Record<string, unknown>)
      : {};
  const start =
    typeof details.eventTimeStart === "string" && /^\d{2}:\d{2}$/.test(details.eventTimeStart)
      ? details.eventTimeStart
      : hhmmFromBookingDate(row.eventDate, tz);
  const end =
    typeof details.eventTimeEnd === "string" && /^\d{2}:\d{2}$/.test(details.eventTimeEnd)
      ? details.eventTimeEnd
      : start;

  if (fullName) params.set("fullName", fullName);
  if (email) params.set("email", email);
  if (phone) params.set("phone", phone);
  if (eventDate) params.set("eventDate", eventDate);
  if (row.location) params.set("location", row.location);
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  if (row.notes) params.set("message", row.notes.slice(0, 500));
  if (row.service?.id) params.set("serviceId", row.service.id);
  if (row.eventType?.id) params.set("eventTypeId", row.eventType.id);
  if (row.occasionType?.id) params.set("occasionTypeId", row.occasionType.id);
  params.set("origin", "booking");
  params.set("bookingId", row.id);
  params.set("returnTo", AGENDA_PETICIONES_PATH);

  return `${AGENDAR_PATH}?${params.toString()}`;
}
