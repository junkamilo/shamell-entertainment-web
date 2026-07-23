import { http, HttpResponse } from "msw";
import { makeAdminBookingRow } from "../fixtures/miAgenda.fixture";
import { FIXTURE_BOOKING_ID, FIXTURE_BOOKING_ID_2 } from "../fixtures/uuids.fixture";

export const miAgendaHandlers = [
  http.get("*/api/v1/bookings/admin/calendar", ({ request }) => {
    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    return HttpResponse.json({
      items: [
        makeAdminBookingRow({
          id: FIXTURE_BOOKING_ID,
          eventDate: from ?? "2026-07-20T14:00:00.000Z",
        }),
        makeAdminBookingRow({
          id: FIXTURE_BOOKING_ID_2,
          eventDate: to ?? "2026-07-26T16:00:00.000Z",
          guestFullName: "Guest 2",
        }),
      ],
      from,
      to,
    });
  }),

  http.get("*/api/v1/bookings/admin", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const perPage = Number(url.searchParams.get("perPage") ?? 10);
    const items = [
      makeAdminBookingRow({ id: FIXTURE_BOOKING_ID }),
      makeAdminBookingRow({ id: FIXTURE_BOOKING_ID_2, guestFullName: "Guest 2" }),
    ];
    return HttpResponse.json({
      items,
      meta: {
        page,
        perPage,
        totalItems: items.length,
        totalPages: 1,
        hasPrev: false,
        hasNext: false,
      },
    });
  }),
];
