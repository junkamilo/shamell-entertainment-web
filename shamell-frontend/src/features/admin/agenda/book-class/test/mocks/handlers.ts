import { http, HttpResponse } from "msw";
import {
  makeBookClassEventContext,
  makeBookClassEventOption,
  makeEnrollmentSuccess,
} from "../fixtures/bookClass.fixture";
import {
  FIXTURE_CLASS_EVENT_ID,
  FIXTURE_CLASS_EVENT_ID_2,
} from "../fixtures/uuids.fixture";

export const bookClassHandlers = [
  http.get("*/api/v1/upcoming-events/admin/bookable-class-events", () => {
    return HttpResponse.json({
      events: [
        {
          id: FIXTURE_CLASS_EVENT_ID,
          name: "Salsa Foundations",
          slug: "salsa-foundations",
          timezone: "America/New_York",
          weekdayCount: 1,
          sectionCount: 2,
          upcomingSessionCount: 2,
        },
        {
          id: FIXTURE_CLASS_EVENT_ID_2,
          name: "Bachata Labs",
          slug: "bachata-labs",
          timezone: "America/New_York",
          weekdayCount: 2,
          sectionCount: 1,
          upcomingSessionCount: 3,
        },
      ],
    });
  }),

  http.get("*/api/v1/upcoming-events/admin/events/:eventId/class-booking-context", ({ params }) => {
    const eventId = String(params.eventId);
    const option =
      eventId === FIXTURE_CLASS_EVENT_ID_2
        ? makeBookClassEventOption({
            id: FIXTURE_CLASS_EVENT_ID_2,
            name: "Bachata Labs",
            slug: "bachata-labs",
          })
        : makeBookClassEventOption({ id: eventId });

    return HttpResponse.json(
      makeBookClassEventContext({
        event: {
          id: option.id,
          slug: option.slug,
          name: option.name,
          timezone: "America/New_York",
        },
      }),
    );
  }),

  http.post("*/api/v1/upcoming-events/admin/class-enrollments/cash", async () => {
    return HttpResponse.json(makeEnrollmentSuccess({ message: "Cash enrollment recorded." }));
  }),

  http.post(
    "*/api/v1/upcoming-events/admin/class-enrollments/checkout-session",
    async () => {
      return HttpResponse.json(
        makeEnrollmentSuccess({
          message: "Checkout session created.",
          payUrl: "https://checkout.test/session_123",
        }),
      );
    },
  ),
];
