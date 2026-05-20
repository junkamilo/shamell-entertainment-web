import { getPublicApiBaseUrl } from "../lib/apiBaseUrl";

export async function submitPasswordReset(token: string, newPassword: string): Promise<Response> {
  const base = getPublicApiBaseUrl();
  return fetch(`${base}/api/v1/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
    cache: "no-store",
  });
}
