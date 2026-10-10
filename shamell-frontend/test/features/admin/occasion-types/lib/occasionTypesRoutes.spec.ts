import { describe, expect, it } from "vitest";
import { OCCASION_TYPES_PATH } from "@/features/admin/occasion-types/lib/occasionTypesRoutes";

describe("occasionTypesRoutes", () => {
  it("exports occasion types admin path", () => {
    expect(OCCASION_TYPES_PATH).toBe("/admin/occasion-types");
  });
});
