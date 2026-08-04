/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ON_COMING_EVENTS_BADGE_REFRESH_EVENT,
  markVenueSeatReservationsModuleSeen,
  notifyOnComingEventsBadgeRefresh,
  readLastSeenPaidReservationAtMs,
  writeLastSeenPaidReservationAtMs,
} from "./onComingEventsReservationsNotice";

const LAST_SEEN_KEY = "shamell:on-coming-events:last-seen-paid-at";

describe("onComingEventsReservationsNotice", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("exposes the badge refresh event name", () => {
    expect(ON_COMING_EVENTS_BADGE_REFRESH_EVENT).toBe(
      "shamell:on-coming-events-badge-refresh",
    );
  });

  it("reads and writes last-seen paid-at timestamps", () => {
    expect(readLastSeenPaidReservationAtMs()).toBe(0);
    writeLastSeenPaidReservationAtMs(1_700_000_000_123.9);
    expect(window.localStorage.getItem(LAST_SEEN_KEY)).toBe("1700000000123");
    expect(readLastSeenPaidReservationAtMs()).toBe(1_700_000_000_123);
  });

  it("treats invalid localStorage values as zero", () => {
    window.localStorage.setItem(LAST_SEEN_KEY, "not-a-number");
    expect(readLastSeenPaidReservationAtMs()).toBe(0);
    window.localStorage.setItem(LAST_SEEN_KEY, "-5");
    expect(readLastSeenPaidReservationAtMs()).toBe(0);
  });

  it("dispatches badge refresh on notify", () => {
    const spy = vi.fn();
    window.addEventListener(ON_COMING_EVENTS_BADGE_REFRESH_EVENT, spy);
    notifyOnComingEventsBadgeRefresh();
    expect(spy).toHaveBeenCalledTimes(1);
    window.removeEventListener(ON_COMING_EVENTS_BADGE_REFRESH_EVENT, spy);
  });

  it("marks the module seen and refreshes the badge", () => {
    const spy = vi.fn();
    window.addEventListener(ON_COMING_EVENTS_BADGE_REFRESH_EVENT, spy);
    const before = Date.now();
    markVenueSeatReservationsModuleSeen();
    const stored = readLastSeenPaidReservationAtMs();
    expect(stored).toBeGreaterThanOrEqual(before);
    expect(spy).toHaveBeenCalledTimes(1);
    window.removeEventListener(ON_COMING_EVENTS_BADGE_REFRESH_EVENT, spy);
  });

  it("skips write when now is not newer than previous seen-at", () => {
    const future = Date.now() + 60_000;
    writeLastSeenPaidReservationAtMs(future);
    const spy = vi.fn();
    window.addEventListener(ON_COMING_EVENTS_BADGE_REFRESH_EVENT, spy);
    markVenueSeatReservationsModuleSeen();
    expect(readLastSeenPaidReservationAtMs()).toBe(future);
    expect(spy).not.toHaveBeenCalled();
    window.removeEventListener(ON_COMING_EVENTS_BADGE_REFRESH_EVENT, spy);
  });
});
