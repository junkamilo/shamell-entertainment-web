import { http, HttpResponse } from "msw";
import {
  makeFixedTicketEvent,
  makeSeatAvailability,
  makeVenueFixedEvent,
} from "../fixtures/boxOffice.fixture";

/** Unique box-office routes. Class catalog/context/enrollment reuse book-class MSW handlers. */
export const boxOfficeHandlers = [
  http.get("*/api/v1/upcoming-events/admin/box-office/fixed-events", () => {
    return HttpResponse.json({
      events: [makeVenueFixedEvent(), makeFixedTicketEvent()],
    });
  }),

  http.get("*/api/v1/venue-reservations/admin/availability", () => {
    return HttpResponse.json(makeSeatAvailability());
  }),

  http.post("*/api/v1/upcoming-events/admin/fixed-event-enrollments/cash", () => {
    return HttpResponse.json({ message: "Ticket reserved." });
  }),

  http.post(
    "*/api/v1/upcoming-events/admin/fixed-event-enrollments/checkout-session",
    () => HttpResponse.json({ message: "Payment link sent to customer." }),
  ),

  http.post("*/api/v1/venue-reservations/admin/cash", () => {
    return HttpResponse.json({ message: "Cash reservation confirmed." });
  }),

  http.post("*/api/v1/venue-reservations/admin/checkout-session", () => {
    return HttpResponse.json({ message: "Payment link sent to customer." });
  }),
];
