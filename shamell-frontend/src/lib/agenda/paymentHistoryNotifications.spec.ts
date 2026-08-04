/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  markPaymentHistorySeenNow,
  PAYMENT_HISTORY_LAST_SEEN_AT_KEY,
  readPaymentHistoryLastSeenAt,
} from "./paymentHistoryNotifications";

describe("paymentHistoryNotifications", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("reads 0 when nothing is stored", () => {
    expect(readPaymentHistoryLastSeenAt()).toBe(0);
  });

  it("marks now and reads it back", () => {
    expect(markPaymentHistorySeenNow()).toBe(1_700_000_000_000);
    expect(localStorage.getItem(PAYMENT_HISTORY_LAST_SEEN_AT_KEY)).toBe(
      "1700000000000",
    );
    expect(readPaymentHistoryLastSeenAt()).toBe(1_700_000_000_000);
  });

  it("ignores invalid stored values", () => {
    localStorage.setItem(PAYMENT_HISTORY_LAST_SEEN_AT_KEY, "nope");
    expect(readPaymentHistoryLastSeenAt()).toBe(0);
  });
});
