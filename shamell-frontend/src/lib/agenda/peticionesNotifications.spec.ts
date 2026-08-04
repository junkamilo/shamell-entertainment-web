/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  markPeticionesLaneSeenNow,
  markPeticionesSeenNow,
  notifyPeticionesBadgeRefresh,
  PETICIONES_BADGE_REFRESH_EVENT,
  PETICIONES_LAST_SEEN_AT_KEY,
  readPeticionesLastSeenAt,
} from "./peticionesNotifications";

describe("peticionesNotifications", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_100);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("migrates legacy last-seen into bookings and guidance lanes", () => {
    localStorage.setItem(PETICIONES_LAST_SEEN_AT_KEY, "1700000000000");
    expect(readPeticionesLastSeenAt("bookings")).toBe(1_700_000_000_000);
    expect(readPeticionesLastSeenAt("guidance")).toBe(1_700_000_000_000);
  });

  it("marks a single lane and notifies badge refresh", () => {
    const spy = vi.fn();
    window.addEventListener(PETICIONES_BADGE_REFRESH_EVENT, spy);
    expect(markPeticionesLaneSeenNow("private_classes")).toBe(
      1_700_000_000_100,
    );
    expect(readPeticionesLastSeenAt("private_classes")).toBe(
      1_700_000_000_100,
    );
    expect(spy).toHaveBeenCalled();
    window.removeEventListener(PETICIONES_BADGE_REFRESH_EVENT, spy);
  });

  it("marks all lanes via legacy helper", () => {
    markPeticionesSeenNow();
    expect(readPeticionesLastSeenAt("bookings")).toBe(1_700_000_000_100);
    expect(readPeticionesLastSeenAt("guidance")).toBe(1_700_000_000_100);
    expect(readPeticionesLastSeenAt("private_classes")).toBe(
      1_700_000_000_100,
    );
  });

  it("dispatches the badge refresh event", () => {
    const spy = vi.fn();
    window.addEventListener(PETICIONES_BADGE_REFRESH_EVENT, spy);
    notifyPeticionesBadgeRefresh();
    expect(spy).toHaveBeenCalledTimes(1);
    window.removeEventListener(PETICIONES_BADGE_REFRESH_EVENT, spy);
  });
});
