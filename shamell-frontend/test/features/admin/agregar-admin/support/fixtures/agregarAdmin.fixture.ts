import type {
  AdminInvitePayload,
  AdminInviteVerifyPayload,
} from "@/features/admin/agregar-admin/types/agregarAdmin.types";
import {
  FIXTURE_ADMIN_EMAIL,
  FIXTURE_ADMIN_FULL_NAME,
  FIXTURE_ADMIN_PASSWORD,
  FIXTURE_INVITE_CODE,
} from "@test/features/admin/agregar-admin/support/fixtures/uuids.fixture";

export function makeInvitePayload(
  overrides: Partial<AdminInvitePayload> = {},
): AdminInvitePayload {
  return {
    email: FIXTURE_ADMIN_EMAIL,
    fullName: FIXTURE_ADMIN_FULL_NAME,
    ...overrides,
  };
}

export function makeInviteVerifyPayload(
  overrides: Partial<AdminInviteVerifyPayload> = {},
): AdminInviteVerifyPayload {
  return {
    email: FIXTURE_ADMIN_EMAIL,
    code: FIXTURE_INVITE_CODE,
    password: FIXTURE_ADMIN_PASSWORD,
    ...overrides,
  };
}
