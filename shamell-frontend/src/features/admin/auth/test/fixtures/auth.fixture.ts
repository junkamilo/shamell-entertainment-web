import type { AdminLoginActionResult } from "../../types/login.types";
import {
  FIXTURE_ACCESS_TOKEN,
  FIXTURE_ADMIN_EMAIL,
  FIXTURE_ADMIN_USER_ID,
} from "./uuids.fixture";

export function makeAdminLoginUser(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: FIXTURE_ADMIN_USER_ID,
    email: FIXTURE_ADMIN_EMAIL,
    fullName: "Admin User",
    role: "SUPER_ADMIN",
    ...overrides,
  };
}

export function makeAdminLoginSuccessResponse(
  overrides: {
    accessToken?: string;
    user?: Record<string, unknown>;
  } = {},
) {
  return {
    accessToken: overrides.accessToken ?? FIXTURE_ACCESS_TOKEN,
    user: overrides.user ?? makeAdminLoginUser(),
  };
}

export function makeLoginActionSuccess(
  overrides: Partial<Extract<AdminLoginActionResult, { ok: true }>> = {},
): Extract<AdminLoginActionResult, { ok: true }> {
  return {
    ok: true,
    status: 200,
    accessToken: FIXTURE_ACCESS_TOKEN,
    user: makeAdminLoginUser(),
    ...overrides,
  };
}

export function makeLoginActionFailure(
  overrides: Partial<Extract<AdminLoginActionResult, { ok: false }>> = {},
): Extract<AdminLoginActionResult, { ok: false }> {
  return {
    ok: false,
    status: 401,
    message: "Invalid admin credentials.",
    ...overrides,
  };
}
