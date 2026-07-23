import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchMiAgendaBookings } from "./fetchMiAgendaBookings";
import { FIXTURE_BOOKING_ID } from "../test/fixtures/uuids.fixture";

describe("fetchMiAgendaBookings", () => {
  it("uses the calendar endpoint when from/to are set without page", async () => {
    const result = await fetchMiAgendaBookings("token-1", {
      from: "2026-07-20T00:00:00.000Z",
      to: "2026-07-26T23:59:59.999Z",
      activeOnly: true,
    });
    expect(result.bookings[0]?.id).toBe(FIXTURE_BOOKING_ID);
    expect(result.meta.totalPages).toBe(1);
  });

  it("falls back to paginated admin list when calendar fails", async () => {
    server.use(
      http.get("*/api/v1/bookings/admin/calendar", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    const result = await fetchMiAgendaBookings("token-1", {
      from: "2026-07-20T00:00:00.000Z",
      to: "2026-07-26T23:59:59.999Z",
      page: 1,
      perPage: 10,
    });
    expect(result.bookings.length).toBeGreaterThan(0);
    expect(result.meta.page).toBe(1);
  });

  it("throws when the list endpoint fails", async () => {
    server.use(
      http.get("*/api/v1/bookings/admin", () =>
        HttpResponse.json({ message: "Boom" }, { status: 500 }),
      ),
    );
    await expect(fetchMiAgendaBookings("token-1", { page: 1 })).rejects.toThrow(
      /Boom|Could not load bookings/,
    );
  });

  it("accepts a raw array list payload", async () => {
    server.use(
      http.get("*/api/v1/bookings/admin", () =>
        HttpResponse.json([{ id: FIXTURE_BOOKING_ID, eventDate: "2026-07-22T14:00:00.000Z" }]),
      ),
    );
    const result = await fetchMiAgendaBookings("token-1", { page: 1 });
    expect(result.bookings).toHaveLength(1);
    expect(result.meta.totalItems).toBe(1);
  });
});
