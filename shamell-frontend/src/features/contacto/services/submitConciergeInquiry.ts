import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import { getPublicApiBaseUrl } from "@/lib/publicApiBaseUrl";

export type SubmitConciergeInquiryBody = {
  fullName: string;
  email: string;
  phone?: string;
  eventDate?: string;
  location?: string;
  message: string;
  inquiryDetails: Record<string, unknown>;
};

export type SubmitConciergeInquiryResult =
  | { ok: true }
  | { ok: false; message: string };

export async function submitConciergeInquiry(
  body: SubmitConciergeInquiryBody,
): Promise<SubmitConciergeInquiryResult> {
  const base = getPublicApiBaseUrl();
  const res = await fetch(`${base}/api/v1/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...body,
      serviceType: "GENERAL",
      subject: "Concierge inquiry - client needs guidance",
    }),
  });
  const resData = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      message: nestApiErrorMessage(resData, "Could not send your concierge inquiry. Please try again."),
    };
  }
  return { ok: true };
}
