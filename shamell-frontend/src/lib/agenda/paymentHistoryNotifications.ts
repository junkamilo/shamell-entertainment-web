export const PAYMENT_HISTORY_LAST_SEEN_AT_KEY = "paymentHistory.lastSeenAt";

export function readPaymentHistoryLastSeenAt(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(PAYMENT_HISTORY_LAST_SEEN_AT_KEY);
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function markPaymentHistorySeenNow(): number {
  if (typeof window === "undefined") return 0;
  const now = Date.now();
  window.localStorage.setItem(PAYMENT_HISTORY_LAST_SEEN_AT_KEY, String(now));
  return now;
}
