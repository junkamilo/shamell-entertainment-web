import { describe, expect, it } from "vitest";
import { fetchAdminVenueReservations } from "@/features/admin/venue-reservations/services/fetchAdminVenueReservations";
import { cancelAdminVenueReservation } from "@/features/admin/venue-reservations/services/cancelAdminVenueReservation";
import {
  makeVenueReservationsApiPayload,
  makeVenueSeatReservation,
} from "@test/features/admin/venue-reservations/support/fixtures/venueReservations.fixture";
import { FIXTURE_RESERVATION_ID } from "@test/features/admin/venue-reservations/support/fixtures/uuids.fixture";
import { createMockVenueReservationsPageState } from "@test/features/admin/venue-reservations/support/helpers/mockVenueReservationsPage";

describe("venue-reservations test environment", () => {
  it("exposes usable fixtures and page mock", () => {
    expect(makeVenueSeatReservation().id).toBe(FIXTURE_RESERVATION_ID);
    expect(makeVenueReservationsApiPayload().reservations).toHaveLength(2);

    const page = createMockVenueReservationsPageState({ isLoading: true });
    expect(page.isLoading).toBe(true);
    page.reload();
    expect(page.reload).toHaveBeenCalled();
  });

  it("serves list and cancel via MSW", async () => {
    const list = await fetchAdminVenueReservations("token-1");
    expect(list.ok).toBe(true);
    expect(list.reservations[0]?.id).toBe(FIXTURE_RESERVATION_ID);

    const cancelled = await cancelAdminVenueReservation(
      "token-1",
      FIXTURE_RESERVATION_ID,
    );
    expect(cancelled.ok).toBe(true);
  });
});
