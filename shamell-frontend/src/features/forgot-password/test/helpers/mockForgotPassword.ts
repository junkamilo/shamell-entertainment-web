import { vi } from "vitest";
import {
  FIXTURE_NEW_PASSWORD,
  FIXTURE_RESET_TOKEN,
  FIXTURE_USER_EMAIL,
} from "../fixtures/uuids.fixture";
import { buildResetPasswordHref } from "../../lib/forgotPasswordRoutes";

export function createMockForgotPasswordState(
  overrides: Record<string, unknown> = {},
) {
  return {
    email: FIXTURE_USER_EMAIL,
    setEmail: vi.fn(),
    error: null as string | null,
    message: null as string | null,
    resetLink: null as string | null,
    isSubmitting: false,
    onSubmit: vi.fn(async (event?: { preventDefault?: () => void }) => {
      event?.preventDefault?.();
    }),
    ...overrides,
  };
}

export function createMockResetPasswordState(
  overrides: Record<string, unknown> = {},
) {
  return {
    token: FIXTURE_RESET_TOKEN,
    tokenError: null as string | null,
    newPassword: FIXTURE_NEW_PASSWORD,
    setNewPassword: vi.fn(),
    confirmPassword: FIXTURE_NEW_PASSWORD,
    setConfirmPassword: vi.fn(),
    error: null as string | null,
    message: null as string | null,
    isSubmitting: false,
    onSubmit: vi.fn(async (event?: { preventDefault?: () => void }) => {
      event?.preventDefault?.();
    }),
    ...overrides,
  };
}

export function makeDevResetLink() {
  return buildResetPasswordHref(FIXTURE_RESET_TOKEN);
}
