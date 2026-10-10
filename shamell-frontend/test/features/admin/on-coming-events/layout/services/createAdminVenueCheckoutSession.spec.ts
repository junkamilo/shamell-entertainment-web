import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@test/support/server";
import { createAdminVenueCheckoutSession } from "@/features/admin/on-coming-events/layout/services/createAdminVenueCheckoutSession";
import { venueCheckoutSessionHandler } from "@test/features/admin/on-coming-events/support/mocks/handlers";
import {
  FIXTURE_LAYOUT_ITEM_ID,
  FIXTURE_RESERVATION_ID,
  FIXTURE_TABLE_CONFIG_ID,
} from "@test/features/admin/on-coming-events/support/fixtures/uuids.fixture";

const ROUTE = "*/api/v1/venue-reservations/admin/checkout-session";

describe("createAdminVenueCheckoutSession", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns reservationId on success", async () => {
    server.use(venueCheckoutSessionHandler());
    const result = await createAdminVenueCheckoutSession("token-1", {
      kind: "catalog_table",
      layoutItemId: FIXTURE_LAYOUT_ITEM_ID,
      venueTableConfigId: FIXTURE_TABLE_CONFIG_ID,
      customerName: "Ada Lovelace",
      customerEmail: "ada@example.com",
    });
    expect(result).toEqual({
      ok: true,
      reservationId: FIXTURE_RESERVATION_ID,
      message: "Payment link sent.",
      payUrl: "https://pay.example.com/r/1",
    });
  });

  it("posts the request body", async () => {
    let body: unknown;
    server.use(
      http.post(ROUTE, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          reservationId: FIXTURE_RESERVATION_ID,
          message: "Payment link sent.",
          payUrl: "https://pay.example.com/r/1",
        });
      }),
    );
    const payload = {
      kind: "catalog_table" as const,
      layoutItemId: FIXTURE_LAYOUT_ITEM_ID,
      venueTableConfigId: FIXTURE_TABLE_CONFIG_ID,
      customerName: "Ada Lovelace",
      customerEmail: "ada@example.com",
      upcomingEventSlug: "gala-night",
    };
    await createAdminVenueCheckoutSession("token-1", payload);
    expect(body).toMatchObject(payload);
  });

  it("returns ok:false when response lacks reservationId", async () => {
    server.use(
      http.post(ROUTE, () =>
        HttpResponse.json({ message: "Payment link sent to customer." }),
      ),
    );
    const result = await createAdminVenueCheckoutSession("token-1", {
      kind: "catalog_table",
      layoutItemId: FIXTURE_LAYOUT_ITEM_ID,
      customerName: "Ada",
      customerEmail: "ada@example.com",
    });
    expect(result).toEqual({ ok: false, message: "Invalid response." });
  });

  it("returns ok:false when offline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const result = await createAdminVenueCheckoutSession("token-1", {
      kind: "standalone_chair",
      layoutItemId: FIXTURE_LAYOUT_ITEM_ID,
      customerName: "Ada",
      customerEmail: "ada@example.com",
    });
    expect(result).toEqual({ ok: false, message: "Could not reach the server." });
  });
});
