import { http, HttpResponse } from "msw";
import { makeVenueReservationsApiPayload } from "../fixtures/venueReservations.fixture";

/**
 * List + cancel for seat reservations admin.
 * Does not own availability/cash/checkout (box-office / on-coming-events).
 */
export const venueReservationsHandlers = [
  http.get("*/api/v1/venue-reservations/admin", () => {
    return HttpResponse.json(makeVenueReservationsApiPayload());
  }),

  http.patch("*/api/v1/venue-reservations/admin/:id/cancel", () => {
    return HttpResponse.json({ ok: true, message: "Reservation cancelled." });
  }),
];

export function venueReservationsListHandler(
  payload = makeVenueReservationsApiPayload(),
) {
  return http.get("*/api/v1/venue-reservations/admin", () => {
    return HttpResponse.json(payload);
  });
}
