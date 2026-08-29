import { describe, expect, it } from "vitest";
import {
  ACTIVITY_ACCENT_FALLBACKS,
  resolveActivityAccent,
} from "./resolveActivityAccent";

describe("resolveActivityAccent", () => {
  it("passes through valid 6-digit hex", () => {
    expect(resolveActivityAccent("#0d3d32", 0)).toBe("#0d3d32");
    expect(resolveActivityAccent("  #1a2a6c  ", 2)).toBe("#1a2a6c");
  });

  it("expands 3-digit hex", () => {
    expect(resolveActivityAccent("#0a3", 0)).toBe("#00aa33");
  });

  it("falls back by index when null or invalid", () => {
    expect(resolveActivityAccent(null, 0)).toBe(ACTIVITY_ACCENT_FALLBACKS[0]);
    expect(resolveActivityAccent(undefined, 1)).toBe(ACTIVITY_ACCENT_FALLBACKS[1]);
    expect(resolveActivityAccent("", 2)).toBe(ACTIVITY_ACCENT_FALLBACKS[2]);
    expect(resolveActivityAccent("not-a-color", 0)).toBe(
      ACTIVITY_ACCENT_FALLBACKS[0],
    );
    expect(resolveActivityAccent(null, 3)).toBe(ACTIVITY_ACCENT_FALLBACKS[0]);
  });
});
