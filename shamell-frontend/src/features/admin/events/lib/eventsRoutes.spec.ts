import { describe, expect, it } from "vitest";
import { EVENTS_PATH, UPCOMING_EVENTS_ADMIN_PATH } from "./eventsRoutes";

describe("eventsRoutes", () => {
  it("re-exports the canonical admin events path", () => {
    expect(EVENTS_PATH).toBe("/admin/events");
  });

  it("re-exports the upcoming events admin path", () => {
    expect(UPCOMING_EVENTS_ADMIN_PATH).toBe("/admin/upcoming-events");
  });
});
