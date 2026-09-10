import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import { getPublicApiBaseUrl } from "@/lib/publicApiBaseUrl";

export type ResendEmailVerificationResult =
  | { ok: true; challengeId: string; emailMasked: string; expiresAt: string }
  | { ok: false; message: string };

export async function resendEmailVerification(
  challengeId: string,
): Promise<ResendEmailVerificationResult> {
  const base = getPublicApiBaseUrl();
  const res = await fetch(`${base}/api/v1/email-verification/resend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challengeId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      message: nestApiErrorMessage(data, "Could not resend the verification code."),
    };
  }
  return {
    ok: true,
    challengeId: String((data as { challengeId?: string }).challengeId ?? challengeId),
    emailMasked: String((data as { emailMasked?: string }).emailMasked ?? ""),
    expiresAt: String((data as { expiresAt?: string }).expiresAt ?? ""),
  };
}
