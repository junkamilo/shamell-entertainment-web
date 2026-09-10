import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import { getPublicApiBaseUrl } from "@/lib/publicApiBaseUrl";

export type VerifyEmailCodeResult =
  | { ok: true; verifiedToken: string }
  | { ok: false; message: string };

export async function verifyEmailCode(input: {
  challengeId: string;
  code: string;
}): Promise<VerifyEmailCodeResult> {
  const base = getPublicApiBaseUrl();
  const res = await fetch(`${base}/api/v1/email-verification/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      message: nestApiErrorMessage(data, "Could not verify your email."),
    };
  }
  return {
    ok: true,
    verifiedToken: String((data as { verifiedToken?: string }).verifiedToken ?? ""),
  };
}
