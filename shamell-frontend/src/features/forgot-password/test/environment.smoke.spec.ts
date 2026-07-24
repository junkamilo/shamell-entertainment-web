import { describe, expect, it } from "vitest";
import { requestPasswordReset } from "../services/requestPasswordReset";
import { submitPasswordReset } from "../services/submitPasswordReset";
import { buildResetPasswordHref } from "../lib/forgotPasswordRoutes";
import { makeForgotPasswordSuccessBody } from "./fixtures/forgotPassword.fixture";
import {
  FIXTURE_NEW_PASSWORD,
  FIXTURE_RESET_TOKEN,
  FIXTURE_USER_EMAIL,
} from "./fixtures/uuids.fixture";
import { createMockForgotPasswordState } from "./helpers/mockForgotPassword";

describe("forgot-password test environment", () => {
  it("exposes usable fixtures and form mock", () => {
    expect(makeForgotPasswordSuccessBody().resetLink).toContain(
      FIXTURE_RESET_TOKEN,
    );
    expect(buildResetPasswordHref(FIXTURE_RESET_TOKEN)).toContain("token=");

    const form = createMockForgotPasswordState({ isSubmitting: true });
    expect(form.isSubmitting).toBe(true);
    form.onSubmit();
    expect(form.onSubmit).toHaveBeenCalled();
  });

  it("serves forgot and reset password via MSW", async () => {
    const forgot = await requestPasswordReset(FIXTURE_USER_EMAIL);
    expect(forgot.ok).toBe(true);
    const forgotBody = (await forgot.json()) as { message?: string };
    expect(forgotBody.message).toBeTruthy();

    const reset = await submitPasswordReset(
      FIXTURE_RESET_TOKEN,
      FIXTURE_NEW_PASSWORD,
    );
    expect(reset.ok).toBe(true);
  });
});
