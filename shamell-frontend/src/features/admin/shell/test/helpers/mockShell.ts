import { vi } from "vitest";
import { makeAdminSessionUser } from "../fixtures/shell.fixture";

export function createMockAdminSession(
  overrides: Record<string, unknown> = {},
) {
  const user = makeAdminSessionUser(
    (overrides.user as Record<string, unknown> | undefined) ?? {},
  );
  const rest = { ...overrides };
  delete rest.user;

  return {
    isLoggedIn: true,
    role: "SUPER_ADMIN" as string | null,
    user,
    token: "token-1",
    permissions: [
      "admin.invite",
      "admin.access",
      "catalog.manage",
      "agenda.manage",
      "venue.manage",
      "content.manage",
    ] as const,
    ...rest,
  };
}

export function createMockRouter() {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  };
}
