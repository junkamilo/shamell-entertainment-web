/** Public password recovery routes. */

export const FORGOT_PASSWORD_PATH = "/forgot-password";

/** Reset form; email link should be `{FRONTEND_ORIGIN}/forgot-password/reset?token={rawToken}`. */
export const RESET_PASSWORD_PATH = "/forgot-password/reset";

export function buildResetPasswordHref(token: string): string {
  const q = new URLSearchParams({ token });
  return `${RESET_PASSWORD_PATH}?${q.toString()}`;
}
