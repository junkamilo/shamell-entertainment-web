"use client";

export const ON_COMING_EVENTS_BADGE_REFRESH_EVENT =
  "shamell:on-coming-events-badge-refresh";

const LAST_SEEN_PAID_AT_KEY = "shamell:on-coming-events:last-seen-paid-at";

export function readLastSeenPaidReservationAtMs(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(LAST_SEEN_PAID_AT_KEY);
  const parsed = Number(raw ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function writeLastSeenPaidReservationAtMs(ms: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_SEEN_PAID_AT_KEY, String(Math.max(0, Math.floor(ms))));
}

export function notifyOnComingEventsBadgeRefresh(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ON_COMING_EVENTS_BADGE_REFRESH_EVENT));
}

/** Clears the seat-reservations sidebar badge after the admin opens that module. */
export function markVenueSeatReservationsModuleSeen(): void {
  const previousSeenAt = readLastSeenPaidReservationAtMs();
  const now = Date.now();
  if (now <= previousSeenAt) return;
  writeLastSeenPaidReservationAtMs(now);
  notifyOnComingEventsBadgeRefresh();
}

