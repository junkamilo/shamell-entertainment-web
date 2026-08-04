import { vi } from "vitest";
import { makeAdminPermissions, makeAdminToken } from "../fixtures/adminLib.fixture";
import {
  FIXTURE_ADMIN_ROLE,
  FIXTURE_SUPER_ADMIN_ROLE,
} from "../fixtures/uuids.fixture";

export function createMockAdminAuthState(
  overrides: Record<string, unknown> = {},
) {
  return {
    token: makeAdminToken(),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${makeAdminToken()}`,
    },
    ...overrides,
  };
}

export function createMockAdminPermissionsState(
  overrides: Record<string, unknown> = {},
) {
  return {
    role: FIXTURE_ADMIN_ROLE,
    permissions: makeAdminPermissions(),
    canInvite: false,
    ...overrides,
  };
}

export function createMockSuperAdminPermissionsState(
  overrides: Record<string, unknown> = {},
) {
  return {
    role: FIXTURE_SUPER_ADMIN_ROLE,
    permissions: makeAdminPermissions([
      "admin.invite",
      "admin.access",
      "catalog.manage",
      "agenda.manage",
      "venue.manage",
      "content.manage",
    ]),
    canInvite: true,
    ...overrides,
  };
}

export function createLocalStorageTokenMock(token: string | null) {
  return {
    getItem: vi.fn(() => token),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
}
