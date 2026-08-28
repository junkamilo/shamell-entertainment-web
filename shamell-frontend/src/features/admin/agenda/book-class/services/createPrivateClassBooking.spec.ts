import { describe, it, expect, vi, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  createPrivateClassCash,
  createPrivateClassCheckoutSession,
} from "./createPrivateClassBooking";
import type { CreatePrivateClassBookingBody } from "../types/privateClass.types";

const BODY: CreatePrivateClassBookingBody = {
  classType: "Private salsa",
  eventDate: "2030-06-15",
  eventTimeStart: "19:00",
  location: "Studio",
  customerName: "Jane Doe",
  customerEmail: "jane@example.com",
  customerPhone: "555",
  notes: "VIP",
  amountUsd: 150,
};

const BOOKING_ID = "660e8400-e29b-41d4-a716-446655440501";

describe("createPrivateClassCash", () => {
  it("posts to cash and returns booking success with quoteId", async () => {
    let body: unknown;
    server.use(
      http.post(
        "*/api/v1/bookings/admin/private-class/cash",
        async ({ request }) => {
          expect(request.headers.get("Authorization")).toBe("Bearer token-1");
          body = await request.json();
          return HttpResponse.json({
            bookingId: BOOKING_ID,
            message: "Private class reserved.",
            quoteId: "q-1",
          });
        },
      ),
    );

    const result = await createPrivateClassCash("token-1", BODY);

    expect(result).toEqual({
      ok: true,
      bookingId: BOOKING_ID,
      message: "Private class reserved.",
      quoteId: "q-1",
    });
    expect(body).toMatchObject(BODY);
  });

  it("returns ok false with API message on error", async () => {
    server.use(
      http.post("*/api/v1/bookings/admin/private-class/cash", () =>
        HttpResponse.json({ message: "Overlap" }, { status: 409 }),
      ),
    );

    const result = await createPrivateClassCash("token-1", BODY);
    expect(result).toEqual({ ok: false, message: "Overlap" });
  });

  it("returns default failure message without API message", async () => {
    server.use(
      http.post("*/api/v1/bookings/admin/private-class/cash", () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );

    const result = await createPrivateClassCash("token-1", BODY);
    expect(result).toEqual({ ok: false, message: "Request failed." });
  });

  it("returns default failure when error JSON is not an object", async () => {
    server.use(
      http.post("*/api/v1/bookings/admin/private-class/cash", () =>
        HttpResponse.json(null, { status: 502 }),
      ),
    );

    const result = await createPrivateClassCash("token-1", BODY);
    expect(result).toEqual({ ok: false, message: "Request failed." });
  });
});

describe("createPrivateClassCheckoutSession", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts to checkout-session", async () => {
    server.use(
      http.post(
        "*/api/v1/bookings/admin/private-class/checkout-session",
        () =>
          HttpResponse.json({
            bookingId: BOOKING_ID,
            message: "Checkout session created.",
          }),
      ),
    );

    const result = await createPrivateClassCheckoutSession("token-1", BODY);
    expect(result).toEqual({
      ok: true,
      bookingId: BOOKING_ID,
      message: "Checkout session created.",
      quoteId: undefined,
    });
  });

  it("defaults message when success body omits it", async () => {
    server.use(
      http.post(
        "*/api/v1/bookings/admin/private-class/checkout-session",
        () => HttpResponse.json({ bookingId: BOOKING_ID }),
      ),
    );

    const result = await createPrivateClassCheckoutSession("token-1", BODY);
    expect(result).toEqual({
      ok: true,
      bookingId: BOOKING_ID,
      message: "Done.",
      quoteId: undefined,
    });
  });

  it("rejects success bodies without bookingId", async () => {
    server.use(
      http.post(
        "*/api/v1/bookings/admin/private-class/checkout-session",
        () => HttpResponse.json({ message: "weird" }),
      ),
    );

    const result = await createPrivateClassCheckoutSession("token-1", BODY);
    expect(result).toEqual({ ok: false, message: "Invalid response." });
  });

  it("rejects non-object success JSON", async () => {
    server.use(
      http.post(
        "*/api/v1/bookings/admin/private-class/checkout-session",
        () => HttpResponse.json(null),
      ),
    );

    const result = await createPrivateClassCheckoutSession("token-1", BODY);
    expect(result).toEqual({ ok: false, message: "Invalid response." });
  });

  it("rejects unreadable JSON on success", async () => {
    server.use(
      http.post(
        "*/api/v1/bookings/admin/private-class/checkout-session",
        () => new HttpResponse("not-json", { status: 200 }),
      ),
    );

    const result = await createPrivateClassCheckoutSession("token-1", BODY);
    expect(result).toEqual({ ok: false, message: "Invalid response." });
  });

  it("returns offline message when fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    const result = await createPrivateClassCheckoutSession("token-1", BODY);
    expect(result).toEqual({
      ok: false,
      message: "Could not reach the server.",
    });
  });
});
