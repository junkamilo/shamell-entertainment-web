import { getPublicApiBaseUrl } from "../lib/apiBaseUrl";

export type SubmitContactInquiryBody = {
  fullName: string;
  email: string;
  phone?: string;
  eventDate?: string;
  location?: string;
  serviceType?: string;
  message: string;
  inquiryDetails: Record<string, unknown>;
};

export type SubmitContactInquiryResult =
  | { ok: true }
  | { ok: false; message: string };

export async function submitContactInquiry(body: SubmitContactInquiryBody): Promise<SubmitContactInquiryResult> {
  const base = getPublicApiBaseUrl();
  const res = await fetch(`${base}/api/v1/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const resData = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = Array.isArray((resData as { message?: unknown }).message)
      ? ((resData as { message: string[] }).message).join(" ")
      : typeof (resData as { message?: unknown }).message === "string"
        ? (resData as { message: string }).message
        : "Could not send your inquiry. Please try again.";
    return { ok: false, message: msg };
  }
  return { ok: true };
}
