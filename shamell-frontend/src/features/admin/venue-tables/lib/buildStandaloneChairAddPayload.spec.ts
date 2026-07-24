import { describe, expect, it } from "vitest";
import { buildStandaloneChairAddPayload } from "./buildStandaloneChairAddPayload";
import { STANDALONE_CHAIR_MAX_QUANTITY } from "../types/standaloneChairs.types";

describe("buildStandaloneChairAddPayload", () => {
  it("builds payload when inputs are valid", () => {
    const result = buildStandaloneChairAddPayload(2, 3, "35");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.addQuantity).toBe(3);
    expect(result.payload).toEqual({ availableQuantity: 5, unitPrice: 35 });
  });

  it("rejects quantity below 1", () => {
    const result = buildStandaloneChairAddPayload(0, 0, "35");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContain("Quantity must be at least 1.");
  });

  it("rejects when exceeding max inventory", () => {
    const atMax = STANDALONE_CHAIR_MAX_QUANTITY;
    const result = buildStandaloneChairAddPayload(atMax, 1, "35");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.includes("maximum"))).toBe(true);
  });

  it("rejects invalid unit price", () => {
    const result = buildStandaloneChairAddPayload(0, 1, "abc");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContain(
      "Unit price is required and must be a valid amount.",
    );
  });
});
