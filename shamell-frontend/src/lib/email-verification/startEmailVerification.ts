import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import { getPublicApiBaseUrl } from "@/lib/publicApiBaseUrl";
import type { EmailVerificationPurpose } from "./emailVerificationConstants";

export type StartEmailVerificationResult =
  | { ok: true; challengeId: string; emailMasked: string; expiresAt: string }
  | { ok: false; message: string };

export async function startEmailVerification(input: {
  purpose: EmailVerificationPurpose;
  email: string;
  recaptchaToken: string;
}): Promise<StartEmailVerificationResult> {
  const base = getPublicApiBaseUrl();
  const res = await fetch(`${base}/api/v1/email-verification/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      message: nestApiErrorMessage(data, "Could not send the verification code. Please try again."),
    };
  }
  return {
    ok: true,
    challengeId: String((data as { challengeId?: string }).challengeId ?? ""),
    emailMasked: String((data as { emailMasked?: string }).emailMasked ?? ""),
    expiresAt: String((data as { expiresAt?: string }).expiresAt ?? ""),
  };
}
