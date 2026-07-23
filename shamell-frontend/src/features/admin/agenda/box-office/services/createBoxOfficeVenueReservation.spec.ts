import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/server";
import { makeFixedDetails } from "../test/fixtures/boxOffice.fixture";
import {
  FIXTURE_LAYOUT_TABLE_ID,
  FIXTURE_VENUE_EVENT_ID,
} from "../test/fixtures/uuids.fixture";
import {
  createBoxOfficeVenueCash,
  createBoxOfficeVenueCheckout,
  type BoxOfficeVenueReserveBody,
} from "./createBoxOfficeVenueReservation";

const CASH_ROUTE = "*/api/v1/venue-reservations/admin/cash";
const CHECKOUT_ROUTE = "*/api/v1/venue-reservations/admin/checkout-session";

function makeBody(): BoxOfficeVenueReserveBody {
  return {
    kind: "catalog_table",
    layoutItemId: FIXTURE_LAYOUT_TABLE_ID,
    customerName: "Jane Doe",
    customerEmail: "jane@example.com",
    upcomingEventId: FIXTURE_VENUE_EVENT_ID,
    boxOfficeDetails: makeFixedDetails({ purchaseKind: "venue_seating" }),
  };
}

describe("createBoxOfficeVenueCash", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the body and returns the API message on success", async () => {
    let body: unknown;
    server.use(
      http.post(CASH_ROUTE, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ message: "Cash reservation confirmed." });
      }),
    );

    const payload = makeBody();
    const result = await createBoxOfficeVenueCash("token-1", payload);

    expect(result).toEqual({
      ok: true,
      message: "Cash reservation confirmed.",
    });
    expect(body).toMatchObject(payload);
  });

  it("returns ok:false with the API message on error", async () => {
    server.use(
      http.post(CASH_ROUTE, () =>
        HttpResponse.json({ message: "Seat already taken" }, { status: 409 }),
      ),
    );
    const result = await createBoxOfficeVenueCash("token-1", makeBody());
    expect(result).toEqual({ ok: false, message: "Seat already taken" });
  });

  it("returns a default failure message without an API message", async () => {
    server.use(http.post(CASH_ROUTE, () => HttpResponse.json({}, { status: 500 })));
    const result = await createBoxOfficeVenueCash("token-1", makeBody());
    expect(result).toEqual({
      ok: false,
      message: "Could not confirm cash reservation.",
    });
  });

  it("returns ok:false when offline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const result = await createBoxOfficeVenueCash("token-1", makeBody());
    expect(result).toEqual({
      ok: false,
      message: "Could not reach the server.",
    });
  });
});

describe("createBoxOfficeVenueCheckout", () => {
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
    const result = await createBoxOfficeVenueCheckout("token-1", payload);

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
    const result = await createBoxOfficeVenueCheckout("token-1", makeBody());
    expect(result).toEqual({ ok: false, message: "Stripe unavailable" });
  });

  it("returns a default failure message without an API message", async () => {
    server.use(
      http.post(CHECKOUT_ROUTE, () => HttpResponse.json({}, { status: 500 })),
    );
    const result = await createBoxOfficeVenueCheckout("token-1", makeBody());
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
    const result = await createBoxOfficeVenueCheckout("token-1", makeBody());
    expect(result).toEqual({
      ok: false,
      message: "Could not reach the server.",
    });
  });
});
