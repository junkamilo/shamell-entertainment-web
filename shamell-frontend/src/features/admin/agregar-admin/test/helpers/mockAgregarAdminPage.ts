import { vi } from "vitest";
import {
  FIXTURE_ADMIN_EMAIL,
  FIXTURE_ADMIN_FULL_NAME,
} from "../fixtures/uuids.fixture";

export function createMockAgregarAdminFormState(
  overrides: Record<string, unknown> = {},
) {
  const email =
    typeof overrides.email === "string" ? overrides.email : FIXTURE_ADMIN_EMAIL;
  return {
    phase: 1 as const,
    setPhase: vi.fn(),
    email,
    setEmail: vi.fn(),
    fullName: FIXTURE_ADMIN_FULL_NAME,
    setFullName: vi.fn(),
    code: "",
    setCode: vi.fn(),
    password: "",
    setPassword: vi.fn(),
    isSending: false,
    setIsSending: vi.fn(),
    isVerifying: false,
    setIsVerifying: vi.fn(),
    emailDisplay: email.trim().toLowerCase(),
    resetFlow: vi.fn(),
    goToPhase1: vi.fn(),
    clearVerifyFields: vi.fn(),
    ...overrides,
  };
}

export function createMockAgregarAdminPageState(
  overrides: Record<string, unknown> = {},
) {
  const formOverride =
    (overrides.form as Record<string, unknown> | undefined) ?? {};
  const { form: _f, ...rest } = overrides;
  return {
    form: createMockAgregarAdminFormState(formOverride),
    sendVerificationCode: vi.fn(async () => undefined),
    onSendCodeForm: vi.fn((event?: { preventDefault?: () => void }) => {
      event?.preventDefault?.();
    }),
    onAddAdmin: vi.fn(async (event?: { preventDefault?: () => void }) => {
      event?.preventDefault?.();
    }),
    ...rest,
  };
}
