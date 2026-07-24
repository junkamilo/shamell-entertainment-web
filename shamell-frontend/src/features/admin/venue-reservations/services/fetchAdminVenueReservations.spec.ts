import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchAdminVenueReservations } from "./fetchAdminVenueReservations";
import { FIXTURE_RESERVATION_ID } from "../test/fixtures/uuids.fixture";
import { venueReservationsListHandler } from "../test/mocks/handlers";
import { makeVenueReservationsApiPayload } from "../test/fixtures/venueReservations.fixture";

describe("fetchAdminVenueReservations", () => {
  it("loads reservations with meta", async () => {
    server.use(venueReservationsListHandler());
    const result = await fetchAdminVenueReservations("token-1");
    expect(result.ok).toBe(true);
    expect(result.reservations[0]?.id).toBe(FIXTURE_RESERVATION_ID);
    expect(result.meta.totalItems).toBeGreaterThan(0);
  });

  it("sends bearer token and query params", async () => {
    let auth: string | null = null;
    let url = "";
    server.use(
      http.get("*/api/v1/venue-reservations/admin", ({ request }) => {
        auth = request.headers.get("Authorization");
        url = request.url;
        return HttpResponse.json(makeVenueReservationsApiPayload([]));
      }),
    );

    await fetchAdminVenueReservations("token-1", {
      status: "PAID",
      paymentChannel: "CASH",
      layoutItemId: "item-1",
      page: 2,
      perPage: 25,
    });

    expect(auth).toBe("Bearer token-1");
    expect(url).toContain("status=PAID");
    expect(url).toContain("paymentChannel=CASH");
    expect(url).toContain("layoutItemId=item-1");
    expect(url).toContain("page=2");
    expect(url).toContain("perPage=25");
  });

  it("returns ok false on 500", async () => {
    server.use(
      http.get("*/api/v1/venue-reservations/admin", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    const result = await fetchAdminVenueReservations("token-1");
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/Could not load reservations/);
  });

  it("returns empty list when reservations missing", async () => {
    server.use(
      http.get("*/api/v1/venue-reservations/admin", () =>
        HttpResponse.json({ meta: { page: 1, perPage: 10, totalItems: 0 } }),
      ),
    );
    const result = await fetchAdminVenueReservations("token-1");
    expect(result.ok).toBe(true);
    expect(result.reservations).toEqual([]);
  });
});
