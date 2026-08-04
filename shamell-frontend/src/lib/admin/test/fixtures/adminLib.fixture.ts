import type { AdminPermission, AdminStaffRole } from "../../permissions";
import {
  FIXTURE_ADMIN_ROLE,
  FIXTURE_ADMIN_TOKEN,
  FIXTURE_SUPER_ADMIN_ROLE,
} from "./uuids.fixture";

export function makeAdminToken(token = FIXTURE_ADMIN_TOKEN) {
  return token;
}

export function makeAdminStaffRole(
  role: AdminStaffRole = FIXTURE_ADMIN_ROLE,
): AdminStaffRole {
  return role;
}

export function makeSuperAdminRole(): AdminStaffRole {
  return FIXTURE_SUPER_ADMIN_ROLE;
}

export function makeAdminPermissions(
  permissions: readonly AdminPermission[] = [
    "admin.access",
    "catalog.manage",
    "agenda.manage",
    "venue.manage",
    "content.manage",
  ],
): AdminPermission[] {
  return [...permissions];
}

export function makePriceCases() {
  return {
    valid: "1,250.50",
    validRounded: 1250.5,
    empty: "   ",
    negative: "-10",
    invalid: "abc",
  } as const;
}
