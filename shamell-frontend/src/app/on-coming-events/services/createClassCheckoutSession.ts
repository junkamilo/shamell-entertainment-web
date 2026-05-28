import { getPublicApiBaseUrl } from "../lib/apiBaseUrl";

export type CreateClassCheckoutBody = {
  sessionId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
};

export async function createClassCheckoutSession(
  slug: string,
  body: CreateClassCheckoutBody,
): Promise<{ ok: true; clientSecret: string } | { ok: false; message: string }> {
  const base = getPublicApiBaseUrl();
  const response = await fetch(
    `${base}/api/v1/upcoming-events/${encodeURIComponent(slug)}/sessions/checkout-session`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : "Could not start checkout.";
    return { ok: false, message: msg };
  }
  if (!data || typeof data !== "object" || typeof (data as { clientSecret?: unknown }).clientSecret !== "string") {
    return { ok: false, message: "Invalid checkout response." };
  }
  return { ok: true, clientSecret: (data as { clientSecret: string }).clientSecret };
}
