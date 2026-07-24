import { describe, expect, it } from "vitest";
import { VENUE_RESERVATIONS_ADMIN_PATH } from "@/lib/admin/routes";
import { VENUE_RESERVATIONS_ADMIN_PATH as featurePath } from "./venueReservationsRoutes";

describe("venueReservationsRoutes", () => {
  it("re-exports the admin seat reservations path", () => {
    expect(featurePath).toBe(VENUE_RESERVATIONS_ADMIN_PATH);
    expect(featurePath).toBe("/admin/venue-reservations");
  });
});
