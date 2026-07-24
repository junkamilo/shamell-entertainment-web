import { describe, expect, it } from "vitest";
import { ON_COMING_EVENTS_LAYOUT_ADMIN_PATH } from "./floorLayoutRoutes";

describe("floorLayoutRoutes", () => {
  it("re-exports the canonical layout admin path", () => {
    expect(ON_COMING_EVENTS_LAYOUT_ADMIN_PATH).toBe("/admin/on-coming-events/layout");
  });
});
