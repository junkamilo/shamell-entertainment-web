import { http, HttpResponse } from "msw";
import { makeAgendaHubBadges } from "../fixtures/agendaHub.fixture";

export const agendaHubHandlers = [
  http.get("*/api/v1/agenda/hub-badges", ({ request }) => {
    const url = new URL(request.url);
    const hasSince =
      url.searchParams.has("peticionesBookingsSince") ||
      url.searchParams.has("paymentsSince");
    return HttpResponse.json(
      makeAgendaHubBadges({
        peticionesBadge: hasSince ? 3 : 2,
        paymentHistoryBadge: hasSince ? 4 : 1,
      }),
    );
  }),

  http.get("*/api/v1/contact/peticiones/badge", ({ request }) => {
    const url = new URL(request.url);
    const since = url.searchParams.get("since");
    const lane = url.searchParams.get("lane") ?? "bookings";
    const base = since ? 5 : 0;
    const laneBoost =
      lane === "guidance" ? 1 : lane === "private_classes" ? 2 : 0;
    return HttpResponse.json({ count: base + laneBoost });
  }),
];
