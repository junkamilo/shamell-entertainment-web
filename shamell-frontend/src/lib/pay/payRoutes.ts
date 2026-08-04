/** Canonical public pay-link routes (token checkout + Stripe returns). */

export const PAY_ROOT_PATH = "/pay";
export const PAY_QUOTE_PATH = "/pay/quote";
export const PAY_CLASS_PATH = "/pay/class";
export const PAY_VENUE_SEAT_PATH = "/pay/venue-seat";
export const PAY_QUOTE_RETURN_PATH = "/pay/quote/return";
export const PAY_CLASS_RETURN_PATH = "/pay/class/return";
export const PAY_VENUE_SEAT_RETURN_PATH = "/pay/venue-seat/return";

function buildPayTokenHref(basePath: string, token: string): string {
  const q = new URLSearchParams({ token });
  return `${basePath}?${q.toString()}`;
}

export function buildPayQuoteHref(token: string): string {
  return buildPayTokenHref(PAY_QUOTE_PATH, token);
}

export function buildPayClassHref(token: string): string {
  return buildPayTokenHref(PAY_CLASS_PATH, token);
}

export function buildPayVenueSeatHref(token: string): string {
  return buildPayTokenHref(PAY_VENUE_SEAT_PATH, token);
}
