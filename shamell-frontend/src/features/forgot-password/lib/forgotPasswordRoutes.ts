/** Public password recovery routes. */

export const FORGOT_PASSWORD_PATH = "/forgot-password";

/**
 * Reset form path. Production email should use `{FRONTEND_ORIGIN}/forgot-password/reset?token={rawToken}`.
 * In development the API may return `resetLink` on forgot-password when the account exists.
 */
export const RESET_PASSWORD_PATH = "/forgot-password/reset";

export function buildResetPasswordHref(token: string): string {
  const q = new URLSearchParams({ token });
  return `${RESET_PASSWORD_PATH}?${q.toString()}`;
}
