import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { createVenueCheckoutSession } from "./createVenueCheckoutSession";
import {
  FIXTURE_CLIENT_SECRET,
  FIXTURE_LAYOUT_ITEM_ID,
  FIXTURE_RESERVATION_ID,
  FIXTURE_TABLE_CONFIG_ID,
} from "../test/fixtures/uuids.fixture";

const body = {
  kind: "catalog_table" as const,
  layoutItemId: FIXTURE_LAYOUT_ITEM_ID,
  venueTableConfigId: FIXTURE_TABLE_CONFIG_ID,
  customerName: "Ada Lovelace",
  customerEmail: "ada@example.com",
};

describe("createVenueCheckoutSession", () => {
  it("returns client secret and reservation id on success", async () => {
    const result = await createVenueCheckoutSession(body);
    expect(result).toEqual({
      ok: true,
      clientSecret: FIXTURE_CLIENT_SECRET,
      reservationId: FIXTURE_RESERVATION_ID,
    });
  });

  it("returns server message on non-ok response", async () => {
    server.use(
      http.post("*/api/v1/venue-reservations/checkout-session", () =>
        HttpResponse.json({ message: "Seat taken" }, { status: 409 }),
      ),
    );
    const result = await createVenueCheckoutSession(body);
    expect(result).toEqual({ ok: false, message: "Seat taken" });
  });

  it("returns fallback message when error body is missing", async () => {
    server.use(
      http.post("*/api/v1/venue-reservations/checkout-session", () =>
        new HttpResponse(null, { status: 500 }),
      ),
    );
    const result = await createVenueCheckoutSession(body);
    expect(result).toEqual({ ok: false, message: "Could not start checkout." });
  });

  it("returns invalid response when payload is malformed", async () => {
    server.use(
      http.post("*/api/v1/venue-reservations/checkout-session", () =>
        HttpResponse.json({ clientSecret: FIXTURE_CLIENT_SECRET }),
      ),
    );
    const result = await createVenueCheckoutSession(body);
    expect(result).toEqual({ ok: false, message: "Invalid checkout response." });
  });
});
