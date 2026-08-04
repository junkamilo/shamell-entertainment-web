import { http, HttpResponse } from "msw";
import type { ContactRequest } from "../../use-admin-contact-requests";
import {
  makeAdminBookingRow,
  makeAdminBookingsPayload,
  makeContactRequest,
  makeContactRequestsPayload,
  makeExperienceServiceApiItem,
  makeHeaderTextContent,
  makeOnComingPromo,
  makePublicAvailabilityPayload,
  makeAboutContent,
} from "../fixtures/hooks.fixture";
import {
  FIXTURE_BOOKING_ID,
  FIXTURE_CONTACT_ID,
} from "../fixtures/uuids.fixture";

/**
 * Shared `src/hooks` routes not already owned by feature handlers.
 * Public GET `/api/v1/about` is owned by `aboutLibHandlers`.
 * Use the exported `*Handler()` helpers via `server.use` when a spec needs
 * to override contacto / mi-agenda / on-coming-events defaults.
 */
export const hooksHandlers = [
  http.get("*/api/v1/header-text", () => {
    return HttpResponse.json(makeHeaderTextContent());
  }),

  http.post("*/api/v1/bookings/admin", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    return HttpResponse.json(
      makeAdminBookingRow({
        id: FIXTURE_BOOKING_ID,
        location:
          typeof body.location === "string" ? body.location : "Studio A",
      }),
    );
  }),

  http.patch("*/api/v1/bookings/admin/:id", async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    return HttpResponse.json(
      makeAdminBookingRow({
        id: String(params.id),
        status: typeof body.status === "string" ? body.status : "CONFIRMED",
      }),
    );
  }),

  http.delete("*/api/v1/bookings/admin/:id", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.post("*/api/v1/bookings/admin/:id/quote", () => {
    return HttpResponse.json({ ok: true, quoteSent: true });
  }),

  http.post("*/api/v1/bookings/admin/:id/send-balance-link", () => {
    return HttpResponse.json({ ok: true, balanceLinkSent: true });
  }),

  http.get("*/api/v1/contact", () => {
    return HttpResponse.json(makeContactRequestsPayload());
  }),

  http.patch("*/api/v1/contact/:id/status", async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      status?: ContactRequest["status"];
    };
    return HttpResponse.json(
      makeContactRequest({
        id: String(params.id ?? FIXTURE_CONTACT_ID),
        status: body.status ?? "RESERVED",
        isRead: true,
      }),
    );
  }),

  http.delete("*/api/v1/contact/:id", () => {
    return HttpResponse.json({ ok: true });
  }),
];

export function experienceServicesHandler(
  items = [makeExperienceServiceApiItem()],
) {
  return http.get("*/api/v1/services", () => HttpResponse.json(items));
}

export function aboutPublicHandler(payload = makeAboutContent()) {
  return http.get("*/api/v1/about", () => HttpResponse.json(payload));
}

export function headerTextPublicHandler(payload = makeHeaderTextContent()) {
  return http.get("*/api/v1/header-text", () => HttpResponse.json(payload));
}

export function onComingSettingsHandler(payload = makeOnComingPromo()) {
  return http.get("*/api/v1/on-coming-events/settings", () =>
    HttpResponse.json(payload),
  );
}

export function publicAvailabilityHandler(
  payload = makePublicAvailabilityPayload(),
) {
  return http.get("*/api/v1/availability/public", () =>
    HttpResponse.json(payload),
  );
}

export function bookingsAdminListHandler(
  payload = makeAdminBookingsPayload(),
) {
  return http.get("*/api/v1/bookings/admin", () =>
    HttpResponse.json(payload),
  );
}

export function contactListHandler(payload = makeContactRequestsPayload()) {
  return http.get("*/api/v1/contact", () => HttpResponse.json(payload));
}
