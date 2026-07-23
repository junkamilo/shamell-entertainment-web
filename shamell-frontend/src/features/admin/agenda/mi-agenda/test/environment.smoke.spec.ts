import { describe, expect, it } from "vitest";
import { fetchMiAgendaBookings } from "../services/fetchMiAgendaBookings";
import {
  makeAdminBookingRow,
  makeEnrichedBooking,
} from "./fixtures/miAgenda.fixture";
import { FIXTURE_BOOKING_ID } from "./fixtures/uuids.fixture";
import { createMockMiAgendaPageState } from "./helpers/mockMiAgendaPage";

describe("mi-agenda test environment", () => {
  it("exposes usable fixtures and page mock", () => {
    const booking = makeAdminBookingRow();
    expect(booking.id).toBe(FIXTURE_BOOKING_ID);
    expect(makeEnrichedBooking().durationM).toBe(90);

    const page = createMockMiAgendaPageState({
      selected: makeEnrichedBooking(),
    });
    expect(page.selected?.id).toBe(FIXTURE_BOOKING_ID);
    page.setSelectedId("x");
    expect(page.setSelectedId).toHaveBeenCalledWith("x");
  });

  it("serves calendar bookings via MSW default handlers", async () => {
    const result = await fetchMiAgendaBookings("token-1", {
      from: "2026-07-20T00:00:00.000Z",
      to: "2026-07-26T23:59:59.999Z",
      activeOnly: true,
    });
    expect(result.bookings.length).toBe(2);
    expect(result.meta.totalItems).toBe(2);
  });
});
