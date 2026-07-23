import { describe, expect, it } from "vitest";
import { EVENT_TYPES_PATH } from "./eventTypesRoutes";

describe("eventTypesRoutes", () => {
  it("re-exports the canonical admin event-types path", () => {
    expect(EVENT_TYPES_PATH).toBe("/admin/event-types");
  });
});
