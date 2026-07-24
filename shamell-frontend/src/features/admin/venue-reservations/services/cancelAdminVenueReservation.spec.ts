import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { cancelAdminVenueReservation } from "./cancelAdminVenueReservation";
import { FIXTURE_RESERVATION_ID } from "../test/fixtures/uuids.fixture";

describe("cancelAdminVenueReservation", () => {
  it("cancels a reservation", async () => {
    const result = await cancelAdminVenueReservation(
      "token-1",
      FIXTURE_RESERVATION_ID,
    );
    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/cancelled/i);
  });

  it("sends bearer token and reservation id", async () => {
    let auth: string | null = null;
    let cancelledId = "";
    server.use(
      http.patch(
        "*/api/v1/venue-reservations/admin/:id/cancel",
        ({ request, params }) => {
          auth = request.headers.get("Authorization");
          cancelledId = String(params.id);
          return HttpResponse.json({ ok: true });
        },
      ),
    );

    await cancelAdminVenueReservation("token-1", FIXTURE_RESERVATION_ID);
    expect(auth).toBe("Bearer token-1");
    expect(cancelledId).toBe(FIXTURE_RESERVATION_ID);
  });

  it("returns message on failure", async () => {
    server.use(
      http.patch("*/api/v1/venue-reservations/admin/:id/cancel", () =>
        HttpResponse.json({ message: "Already cancelled" }, { status: 400 }),
      ),
    );
    const result = await cancelAdminVenueReservation(
      "token-1",
      FIXTURE_RESERVATION_ID,
    );
    expect(result.ok).toBe(false);
    expect(result.message).toBe("Already cancelled");
  });
});
