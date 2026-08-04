import { http, HttpResponse } from "msw";
import {
  makeCheckoutSuccess,
  makeFloorLayoutApiPayload,
  makeHubEvent,
  makeOnComingEventDetail,
  makeOnComingEventsPromo,
  makeSessionsPayload,
  makeStandaloneChairsApiPayload,
  makeVenueAvailability,
  makeVenueSessionStatus,
  makeVenueTableApiRow,
} from "../fixtures/onComingEvents.fixture";
import { FIXTURE_EVENT_SLUG } from "../fixtures/uuids.fixture";

/**
 * Public on-coming-events routes (no /admin). Admin handlers use /admin paths.
 */
export const publicOnComingEventsHandlers = [
  http.get("*/api/v1/events", ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get("publicSection") === "UPCOMING_EVENTS") {
      return HttpResponse.json([makeHubEvent()]);
    }
    return HttpResponse.json([]);
  }),

  http.get("*/api/v1/upcoming-events/:slug/sessions", () => {
    return HttpResponse.json(makeSessionsPayload());
  }),

  http.get("*/api/v1/upcoming-events/:slug/venue", ({ params }) => {
    return HttpResponse.json({
      event: {
        eventTypeName: "Saturday Gala",
        description: "Venue seating night.",
        items: ["Tables"],
      },
      config: {
        reservationEventLabel: "Saturday Gala",
        reservationEventDate: "2030-08-01",
        reservationOpensAt: "2030-07-01T12:00:00.000Z",
      },
      slug: String(params.slug ?? FIXTURE_EVENT_SLUG),
    });
  }),

  http.post(
    "*/api/v1/upcoming-events/:slug/sessions/bundle-checkout-session",
    () => HttpResponse.json(makeCheckoutSuccess()),
  ),

  http.post(
    "*/api/v1/upcoming-events/:slug/sessions/checkout-session",
    () => HttpResponse.json(makeCheckoutSuccess()),
  ),

  http.post(
    "*/api/v1/upcoming-events/:slug/class-package/checkout-session",
    () => HttpResponse.json(makeCheckoutSuccess()),
  ),

  http.post(
    "*/api/v1/upcoming-events/:slug/fixed-event/checkout-session",
    () => HttpResponse.json(makeCheckoutSuccess()),
  ),

  http.get("*/api/v1/upcoming-events/:slug", ({ params }) => {
    return HttpResponse.json(
      makeOnComingEventDetail({
        slug: String(params.slug ?? FIXTURE_EVENT_SLUG),
      }),
    );
  }),

  http.get("*/api/v1/on-coming-events/settings", () => {
    return HttpResponse.json(makeOnComingEventsPromo());
  }),

  http.get("*/api/v1/floor-layout", () => {
    return HttpResponse.json(makeFloorLayoutApiPayload());
  }),

  http.get("*/api/v1/venue-tables", () => {
    return HttpResponse.json([makeVenueTableApiRow()]);
  }),

  http.get("*/api/v1/standalone-chairs", () => {
    return HttpResponse.json(makeStandaloneChairsApiPayload());
  }),

  http.get("*/api/v1/venue-reservations/availability", () => {
    return HttpResponse.json(makeVenueAvailability());
  }),

  http.post("*/api/v1/venue-reservations/checkout-session", () => {
    return HttpResponse.json(makeCheckoutSuccess());
  }),

  http.get("*/api/v1/venue-reservations/session-status", () => {
    return HttpResponse.json(makeVenueSessionStatus());
  }),

  http.get("*/api/v1/fixed-event-enrollments/session-status", () => {
    return HttpResponse.json({
      stripeStatus: "complete",
      enrollment: {
        id: "fe-1",
        status: "PAID",
        customerName: "Ada Lovelace",
        customerEmail: "ada@example.com",
      },
    });
  }),
];
