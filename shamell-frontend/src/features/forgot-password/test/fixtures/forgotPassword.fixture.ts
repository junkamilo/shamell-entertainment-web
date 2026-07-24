import {
  FIXTURE_NEW_PASSWORD,
  FIXTURE_RESET_TOKEN,
  FIXTURE_USER_EMAIL,
} from "./uuids.fixture";
import { buildResetPasswordHref } from "../../lib/forgotPasswordRoutes";

export function makeForgotPasswordSuccessBody(
  overrides: { message?: string; resetLink?: string } = {},
) {
  return {
    message:
      overrides.message ??
      "If this email exists, a secure recovery link has been sent.",
    resetLink:
      overrides.resetLink ?? buildResetPasswordHref(FIXTURE_RESET_TOKEN),
  };
}

export function makeResetPasswordSuccessBody(
  overrides: { message?: string } = {},
) {
  return {
    message: overrides.message ?? "Password updated successfully.",
  };
}

export function makeForgotPasswordRequestBody(
  overrides: { email?: string } = {},
) {
  return { email: overrides.email ?? FIXTURE_USER_EMAIL };
}

export function makeResetPasswordRequestBody(
  overrides: { token?: string; newPassword?: string } = {},
) {
  return {
    token: overrides.token ?? FIXTURE_RESET_TOKEN,
    newPassword: overrides.newPassword ?? FIXTURE_NEW_PASSWORD,
  };
}
