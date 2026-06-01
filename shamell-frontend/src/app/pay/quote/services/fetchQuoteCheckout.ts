function apiBase(): string {
  return (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(/\/$/, "");
}

export async function fetchQuoteCheckoutClientSecret(
  token: string,
): Promise<{ ok: true; clientSecret: string } | { ok: false; message: string }> {
  try {
    const response = await fetch(
      `${apiBase()}/api/v1/bookings/public/quote/checkout?token=${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      return {
        ok: false,
        message: body?.message ?? "This payment link is no longer available.",
      };
    }
    const data = (await response.json()) as { clientSecret?: string };
    if (!data.clientSecret) {
      return { ok: false, message: "Invalid checkout response." };
    }
    return { ok: true, clientSecret: data.clientSecret };
  } catch {
    return { ok: false, message: "Could not load payment form." };
  }
}

export type QuotePaymentSessionStatus = {
  stripeStatus: "complete" | "open" | "expired";
  paymentStatus: string;
  stage: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
};

export async function fetchQuotePaymentSessionStatus(
  sessionId: string,
): Promise<QuotePaymentSessionStatus | null> {
  try {
    const response = await fetch(
      `${apiBase()}/api/v1/bookings/public/quote/session-status?session_id=${encodeURIComponent(sessionId)}`,
      { cache: "no-store" },
    );
    if (!response.ok) return null;
    return (await response.json()) as QuotePaymentSessionStatus;
  } catch {
    return null;
  }
}
