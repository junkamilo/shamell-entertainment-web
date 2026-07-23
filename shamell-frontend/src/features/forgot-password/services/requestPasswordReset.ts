import { getPublicApiBaseUrl } from "@/lib/publicApiBaseUrl";

export async function requestPasswordReset(email: string): Promise<Response> {
  const base = getPublicApiBaseUrl();
  return fetch(`${base}/api/v1/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    cache: "no-store",
  });
}
