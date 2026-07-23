import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/server";
import { makeFixedDetails } from "../test/fixtures/boxOffice.fixture";
import { FIXTURE_FIXED_EVENT_ID } from "../test/fixtures/uuids.fixture";
import {
  createBoxOfficeFixedTicketCash,
  createBoxOfficeFixedTicketCheckout,
  type BoxOfficeFixedTicketBody,
} from "./createBoxOfficeFixedTicket";

const CASH_ROUTE =
  "*/api/v1/upcoming-events/admin/fixed-event-enrollments/cash";
const CHECKOUT_ROUTE =
  "*/api/v1/upcoming-events/admin/fixed-event-enrollments/checkout-session";

function makeBody(): BoxOfficeFixedTicketBody {
  return {
    upcomingEventId: FIXTURE_FIXED_EVENT_ID,
    customerName: "Jane Doe",
    customerEmail: "jane@example.com",
    boxOfficeDetails: makeFixedDetails(),
  };
}

describe("createBoxOfficeFixedTicketCash", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the body and returns the API message on success", async () => {
    let body: unknown;
    server.use(
      http.post(CASH_ROUTE, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ message: "Ticket reserved." });
      }),
    );

    const payload = makeBody();
    const result = await createBoxOfficeFixedTicketCash("token-1", payload);

    expect(result).toEqual({ ok: true, message: "Ticket reserved." });
    expect(body).toMatchObject(payload);
  });

  it("defaults the success message when the API omits it", async () => {
    server.use(http.post(CASH_ROUTE, () => HttpResponse.json({})));
    const result = await createBoxOfficeFixedTicketCash(
      "token-1",
      makeBody(),
    );
    expect(result).toEqual({ ok: true, message: "Ticket reserved." });
  });

  it("returns ok:false with the API message on error", async () => {
    server.use(
      http.post(CASH_ROUTE, () =>
        HttpResponse.json({ message: "Sold out" }, { status: 409 }),
      ),
    );
    const result = await createBoxOfficeFixedTicketCash(
      "token-1",
      makeBody(),
    );
    expect(result).toEqual({ ok: false, message: "Sold out" });
  });

  it("returns a default failure message without an API message", async () => {
    server.use(http.post(CASH_ROUTE, () => HttpResponse.json({}, { status: 500 })));
    const result = await createBoxOfficeFixedTicketCash(
      "token-1",
      makeBody(),
    );
    expect(result).toEqual({ ok: false, message: "Could not reserve ticket." });
  });

  it("returns ok:false when offline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const result = await createBoxOfficeFixedTicketCash(
      "token-1",
      makeBody(),
    );
    expect(result).toEqual({
      ok: false,
      message: "Could not reach the server.",
    });
  });
});

describe("createBoxOfficeFixedTicketCheckout", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the body and returns the API message on success", async () => {
    let body: unknown;
    server.use(
      http.post(CHECKOUT_ROUTE, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ message: "Payment link sent to customer." });
      }),
    );

    const payload = makeBody();
    const result = await createBoxOfficeFixedTicketCheckout(
      "token-1",
      payload,
    );

    expect(result).toEqual({
      ok: true,
      message: "Payment link sent to customer.",
    });
    expect(body).toMatchObject(payload);
  });

  it("returns ok:false with the API message on error", async () => {
    server.use(
      http.post(CHECKOUT_ROUTE, () =>
        HttpResponse.json({ message: "Stripe unavailable" }, { status: 502 }),
      ),
    );
    const result = await createBoxOfficeFixedTicketCheckout(
      "token-1",
      makeBody(),
    );
    expect(result).toEqual({ ok: false, message: "Stripe unavailable" });
  });

  it("returns a default failure message without an API message", async () => {
    server.use(
      http.post(CHECKOUT_ROUTE, () => HttpResponse.json({}, { status: 500 })),
    );
    const result = await createBoxOfficeFixedTicketCheckout(
      "token-1",
      makeBody(),
    );
    expect(result).toEqual({
      ok: false,
      message: "Could not send payment link.",
    });
  });

  it("returns ok:false when offline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const result = await createBoxOfficeFixedTicketCheckout(
      "token-1",
      makeBody(),
    );
    expect(result).toEqual({
      ok: false,
      message: "Could not reach the server.",
    });
  });
});
