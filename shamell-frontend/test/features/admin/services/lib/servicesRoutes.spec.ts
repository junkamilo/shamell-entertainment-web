import { describe, expect, it } from "vitest";
import { SERVICES_PATH } from "@/features/admin/services/lib/servicesRoutes";

describe("servicesRoutes", () => {
  it("re-exports the canonical admin services path", () => {
    expect(SERVICES_PATH).toBe("/admin/services");
  });
});
