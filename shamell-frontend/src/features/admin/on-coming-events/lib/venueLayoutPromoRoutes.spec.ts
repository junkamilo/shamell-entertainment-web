import { describe, expect, it } from "vitest";
import {
  ON_COMING_EVENTS_ADMIN_PATH,
  ON_COMING_EVENTS_LAYOUT_ADMIN_PATH,
  ON_COMING_EVENTS_PUBLIC_PATH,
  VENUE_LAYOUT_PROMO_ADMIN_PATH,
  VENUE_LAYOUT_PUBLIC_PATH,
} from "./venueLayoutPromoRoutes";

describe("venueLayoutPromoRoutes", () => {
  it("re-exports on coming events admin paths", () => {
    expect(ON_COMING_EVENTS_ADMIN_PATH).toBe("/admin/on-coming-events");
    expect(ON_COMING_EVENTS_LAYOUT_ADMIN_PATH).toBe("/admin/on-coming-events/layout");
  });

  it("re-exports public and deprecated alias paths", () => {
    expect(ON_COMING_EVENTS_PUBLIC_PATH).toBe("/on-coming-events");
    expect(VENUE_LAYOUT_PUBLIC_PATH).toBe("/on-coming-events");
    expect(VENUE_LAYOUT_PROMO_ADMIN_PATH).toBe("/admin/on-coming-events");
  });
});
