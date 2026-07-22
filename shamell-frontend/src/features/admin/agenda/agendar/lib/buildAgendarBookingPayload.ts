import type { CreateAdminBookingPayload } from "@/hooks/use-admin-bookings";
import type { NormalizedAgendarForm } from "../types/agendar.types";

export function buildAgendarBookingPayload(
  data: NormalizedAgendarForm,
  eventDateIso: string,
): CreateAdminBookingPayload {
  return {
    serviceId: data.serviceId,
    eventDate: eventDateIso,
    location: data.location,
    eventTypeId: data.eventTypeId,
    occasionTypeId: data.occasionTypeId,
    guestFullName: data.guestFullName,
    guestEmail: data.guestEmail,
    guestPhone: data.guestPhone,
    guestCount: data.guestCount,
    notes: data.notes || undefined,
    status: "PENDING",
    bookingDetails: {
      eventTimeStart: data.eventTimeStart,
      eventTimeEnd: data.eventTimeEnd,
      serviceIds: data.serviceIds,
      eventTypeId: data.eventTypeId,
      occasionTypeId: data.occasionTypeId,
      guestCount: data.guestCount,
    },
  };
}
