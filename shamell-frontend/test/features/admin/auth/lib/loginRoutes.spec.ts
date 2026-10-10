import { describe, expect, it } from "vitest";
import { ADMIN_LOGIN_PATH, SHAMELL_ADMIN_PATH } from "@/features/admin/auth/lib/loginRoutes";

describe("loginRoutes", () => {
  it("re-exports the canonical admin login and home paths", () => {
    expect(ADMIN_LOGIN_PATH).toBe("/admin/login");
    expect(SHAMELL_ADMIN_PATH).toBe("/admin");
  });
});
