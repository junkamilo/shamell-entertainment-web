import { http, HttpResponse } from "msw";
import {
  makePaymentDetail,
  makePaymentsList,
} from "../fixtures/paymentHistory.fixture";
import { FIXTURE_PAYMENT_ID } from "../fixtures/uuids.fixture";

export const paymentHistoryHandlers = [
  http.get("*/api/v1/admin/payments/badge", ({ request }) => {
    const url = new URL(request.url);
    const since = url.searchParams.get("since");
    return HttpResponse.json({ count: since ? 2 : 0 });
  }),

  http.get("*/api/v1/admin/payments/:flow/:id", ({ params }) => {
    return HttpResponse.json(
      makePaymentDetail({
        id: String(params.id ?? FIXTURE_PAYMENT_ID),
        flow: String(params.flow) as "BOOKING_QUOTE",
      }),
    );
  }),

  http.get("*/api/v1/admin/payments", () => {
    return HttpResponse.json(makePaymentsList());
  }),
];
