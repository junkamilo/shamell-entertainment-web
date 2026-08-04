import { describe, it, expect } from "vitest";
import {
  makeAdminPermissions,
  makeAdminStaffRole,
  makeSuperAdminRole,
} from "./test/fixtures/adminLib.fixture";
import {
  ADMIN_PERMISSIONS,
  deriveAdminPermissions,
  hasAdminPermission,
  hasAllAdminPermissions,
  isAdminStaffRole,
} from "./permissions";

describe("permissions", () => {
  it("recognizes ADMIN and SUPER_ADMIN staff roles", () => {
    expect(isAdminStaffRole(makeAdminStaffRole())).toBe(true);
    expect(isAdminStaffRole(makeSuperAdminRole())).toBe(true);
    expect(isAdminStaffRole("USER")).toBe(false);
    expect(isAdminStaffRole(null)).toBe(false);
  });

  it("derives full permissions for SUPER_ADMIN including invite", () => {
    const perms = deriveAdminPermissions(makeSuperAdminRole());
    expect(perms).toEqual([...ADMIN_PERMISSIONS]);
    expect(perms).toContain("admin.invite");
  });

  it("derives ADMIN permissions without invite", () => {
    const perms = deriveAdminPermissions(makeAdminStaffRole());
    expect(perms).not.toContain("admin.invite");
    expect(perms).toEqual(
      ADMIN_PERMISSIONS.filter((p) => p !== "admin.invite"),
    );
  });

  it("returns no permissions for unknown roles", () => {
    expect(deriveAdminPermissions("GUEST")).toEqual([]);
    expect(deriveAdminPermissions(undefined)).toEqual([]);
  });

  it("checks single and multiple required permissions", () => {
    const perms = makeAdminPermissions();
    expect(hasAdminPermission(perms, "catalog.manage")).toBe(true);
    expect(hasAdminPermission(perms, "admin.invite")).toBe(false);
    expect(
      hasAdminPermission(perms, ["catalog.manage", "agenda.manage"]),
    ).toBe(true);
    expect(hasAdminPermission([], "admin.access")).toBe(false);
    expect(hasAdminPermission(null, "admin.access")).toBe(false);
  });

  it("treats empty required lists as allowed in hasAllAdminPermissions", () => {
    expect(hasAllAdminPermissions([], undefined)).toBe(true);
    expect(hasAllAdminPermissions([], [])).toBe(true);
    expect(
      hasAllAdminPermissions(makeAdminPermissions(), ["catalog.manage"]),
    ).toBe(true);
    expect(
      hasAllAdminPermissions(makeAdminPermissions(), ["admin.invite"]),
    ).toBe(false);
  });
});
