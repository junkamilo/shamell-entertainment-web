import { describe, expect, it } from "vitest";
import { OCCASION_TYPES_PATH } from "./occasionTypesRoutes";

describe("occasionTypesRoutes", () => {
  it("exports occasion types admin path", () => {
    expect(OCCASION_TYPES_PATH).toBe("/admin/occasion-types");
  });
});
