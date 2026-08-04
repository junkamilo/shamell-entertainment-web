import { afterEach, describe, expect, it, vi } from "vitest";
import {
  computeParts,
  isFutureEventStart,
  parseTarget,
} from "./countdownHelpers";

describe("parseTarget", () => {
  it("returns NaN for invalid input", () => {
    expect(Number.isNaN(parseTarget("not-a-date"))).toBe(true);
  });

  it("parses Date and ISO string", () => {
    const d = new Date("2030-01-15T12:00:00.000Z");
    expect(parseTarget(d)).toBe(d.getTime());
    expect(parseTarget(d.toISOString())).toBe(d.getTime());
  });
});

describe("computeParts", () => {
  it("returns zeros and complete when past or equal", () => {
    expect(computeParts(1000, 1000)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      complete: true,
    });
    expect(computeParts(500, 1000).complete).toBe(true);
  });

  it("splits remaining time into parts", () => {
    const target = 1000 + (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000;
    expect(computeParts(target, 1000)).toEqual({
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
      complete: false,
    });
  });
});

describe("isFutureEventStart", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false for null/undefined/invalid", () => {
    expect(isFutureEventStart(null)).toBe(false);
    expect(isFutureEventStart(undefined)).toBe(false);
    expect(isFutureEventStart("bad")).toBe(false);
  });

  it("returns false for past and true for future", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-21T12:00:00.000Z"));
    expect(isFutureEventStart("2026-07-20T12:00:00.000Z")).toBe(false);
    expect(isFutureEventStart("2026-07-22T12:00:00.000Z")).toBe(true);
  });
});
