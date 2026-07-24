import { describe, expect, it } from "vitest";
import { SERVICE_TYPES_PATH } from "./serviceTypesRoutes";

describe("serviceTypesRoutes", () => {
  it("exports service types admin path", () => {
    expect(SERVICE_TYPES_PATH).toBe("/admin/service-types");
  });
});
