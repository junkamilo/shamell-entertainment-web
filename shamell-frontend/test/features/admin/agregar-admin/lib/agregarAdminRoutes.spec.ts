import { describe, expect, it } from "vitest";
import { AGREGAR_ADMIN_PATH } from "@/features/admin/agregar-admin/lib/agregarAdminRoutes";

describe("agregarAdminRoutes", () => {
  it('AGREGAR_ADMIN_PATH is "/admin/agregar-admin"', () => {
    expect(AGREGAR_ADMIN_PATH).toBe("/admin/agregar-admin");
  });
});
