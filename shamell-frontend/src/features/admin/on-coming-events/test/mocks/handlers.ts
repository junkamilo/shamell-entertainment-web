import { http, HttpResponse } from "msw";
import {
  makeAdminVenueConfig,
  makeFloorLayoutApiPayload,
  makeFloorLayoutPalette,
  makeReservationEventTemplate,
  makeRecurringReservationEventTemplate,
  makeSettingsApiPayload,
  makeVenueAvailability,
  makeVenueLayoutSettings,
} from "../fixtures/onComingEvents.fixture";
import {
  FIXTURE_EVENT_ID,
  FIXTURE_LAYOUT_ITEM_ID,
  FIXTURE_RESERVATION_ID,
  FIXTURE_TEMPLATE_ID,
} from "../fixtures/uuids.fixture";

/**
 * Own routes for on-coming-events. Venue reservation availability/cash/checkout
 * are also registered by box-office; use the override helpers below via server.use
 * when specs need reservationId / richer bodies.
 */
export const onComingEventsHandlers = [
  http.get("*/api/v1/on-coming-events/settings/admin", () => {
    return HttpResponse.json(makeSettingsApiPayload());
  }),

  http.patch("*/api/v1/on-coming-events/settings/admin", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const settings = makeVenueLayoutSettings({
      promoTitle:
        typeof body.promoTitle === "string"
          ? body.promoTitle
          : makeVenueLayoutSettings().promoTitle,
      promoDescription:
        typeof body.promoDescription === "string"
          ? body.promoDescription
          : makeVenueLayoutSettings().promoDescription,
      clientEnabled:
        typeof body.clientEnabled === "boolean"
          ? body.clientEnabled
          : makeVenueLayoutSettings().clientEnabled,
    });
    return HttpResponse.json({ settings, message: "Settings saved." });
  }),

  http.patch("*/api/v1/on-coming-events/settings/admin/enabled", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      clientEnabled?: boolean;
    };
    const settings = makeVenueLayoutSettings({
      clientEnabled: Boolean(body.clientEnabled),
    });
    return HttpResponse.json({
      settings,
      message: body.clientEnabled ? "Published." : "Hidden.",
    });
  }),

  http.patch("*/api/v1/on-coming-events/settings/admin/media", () => {
    return HttpResponse.json({
      settings: makeVenueLayoutSettings({
        promoImageUrl: "https://cdn.example.com/promo-new.jpg",
      }),
      message: "Media updated.",
    });
  }),

  http.delete("*/api/v1/on-coming-events/settings/admin/media", () => {
    return HttpResponse.json({
      settings: makeVenueLayoutSettings({ promoImageUrl: null }),
      message: "Media removed.",
    });
  }),

  http.get("*/api/v1/upcoming-events/admin/events/:eventId/venue-config", ({ params }) => {
    return HttpResponse.json(
      makeAdminVenueConfig({ eventId: String(params.eventId ?? FIXTURE_EVENT_ID) }),
    );
  }),

  http.patch(
    "*/api/v1/upcoming-events/admin/events/:eventId/venue-config",
    ({ params }) => {
      return HttpResponse.json(
        makeAdminVenueConfig({ eventId: String(params.eventId ?? FIXTURE_EVENT_ID) }),
      );
    },
  ),

  http.post(
    "*/api/v1/upcoming-events/admin/events/:eventId/sessions/regenerate",
    () => HttpResponse.json({ ok: true, message: "Sessions regenerated." }),
  ),

  http.get("*/api/v1/floor-layout/admin", () => {
    return HttpResponse.json(makeFloorLayoutApiPayload());
  }),

  http.put("*/api/v1/floor-layout/admin", () => {
    return HttpResponse.json(makeFloorLayoutApiPayload());
  }),

  http.get("*/api/v1/floor-layout/admin/palette", () => {
    return HttpResponse.json(makeFloorLayoutPalette());
  }),

  http.get("*/api/v1/reservation-event-templates/admin", ({ request }) => {
    const url = new URL(request.url);
    const mode = url.searchParams.get("scheduleMode");
    const all = [
      makeReservationEventTemplate(),
      makeRecurringReservationEventTemplate(),
    ];
    if (mode === "FIXED_EVENT" || mode === "RECURRING_WEEKLY") {
      return HttpResponse.json(all.filter((t) => t.scheduleMode === mode));
    }
    return HttpResponse.json(all);
  }),

  http.post("*/api/v1/reservation-event-templates/admin", () => {
    return HttpResponse.json(makeReservationEventTemplate({ id: FIXTURE_TEMPLATE_ID }));
  }),

  http.patch("*/api/v1/reservation-event-templates/admin/:id", ({ params }) => {
    return HttpResponse.json(
      makeReservationEventTemplate({ id: String(params.id ?? FIXTURE_TEMPLATE_ID) }),
    );
  }),

  http.delete("*/api/v1/reservation-event-templates/admin/:id", () => {
    return HttpResponse.json({ ok: true });
  }),
];

export function venueAvailabilityHandler(
  payload = makeVenueAvailability(),
) {
  return http.get("*/api/v1/venue-reservations/admin/availability", () => {
    return HttpResponse.json(payload);
  });
}

export function venueCashReservationHandler() {
  return http.post("*/api/v1/venue-reservations/admin/cash", () => {
    return HttpResponse.json({
      message: "Cash reservation confirmed.",
      reservation: {
        layoutItemId: FIXTURE_LAYOUT_ITEM_ID,
        customerName: "Ada Lovelace",
      },
    });
  });
}

export function venueCheckoutSessionHandler() {
  return http.post("*/api/v1/venue-reservations/admin/checkout-session", () => {
    return HttpResponse.json({
      reservationId: FIXTURE_RESERVATION_ID,
      message: "Payment link sent.",
      payUrl: "https://pay.example.com/r/1",
    });
  });
}
