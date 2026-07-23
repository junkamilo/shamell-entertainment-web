import { describe, it, expect } from "vitest";
import { ABOUT_ADMIN_PATH } from "./aboutAdminRoutes";

describe("aboutAdminRoutes", () => {
  it("re-exports the canonical admin About path", () => {
    expect(ABOUT_ADMIN_PATH).toBe("/admin/about");
  });
});
