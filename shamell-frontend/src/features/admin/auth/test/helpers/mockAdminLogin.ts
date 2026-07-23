import { vi } from "vitest";
import { FIXTURE_ADMIN_EMAIL } from "../fixtures/uuids.fixture";

export function createMockAdminLoginState(
  overrides: Record<string, unknown> = {},
) {
  return {
    email: FIXTURE_ADMIN_EMAIL,
    setEmail: vi.fn(),
    password: "",
    setPassword: vi.fn(),
    error: null as string | null,
    message: null as string | null,
    isSubmitting: false,
    onSubmit: vi.fn(async (event?: { preventDefault?: () => void }) => {
      event?.preventDefault?.();
    }),
    ...overrides,
  };
}
