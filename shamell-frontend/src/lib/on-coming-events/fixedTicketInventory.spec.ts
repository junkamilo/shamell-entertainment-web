import { describe, expect, it } from "vitest";
import {
  fixedTicketInventoryLabel,
  parseApiInt,
} from "./fixedTicketInventory";

describe("fixedTicketInventoryLabel", () => {
  it("formats capacity, sold, and remaining", () => {
    expect(fixedTicketInventoryLabel(100, 90, 10)).toBe(
      "100 tickets for sale · 10 sold · 90 available",
    );
  });

  it("derives sold from capacity minus remaining when omitted", () => {
    expect(fixedTicketInventoryLabel(50, 40)).toBe(
      "50 tickets for sale · 10 sold · 40 available",
    );
  });

  it("clamps derived sold at zero", () => {
    expect(fixedTicketInventoryLabel(10, 20)).toBe(
      "10 tickets for sale · 0 sold · 20 available",
    );
  });
});

describe("parseApiInt", () => {
  it("truncates finite numbers", () => {
    expect(parseApiInt(12.9)).toBe(12);
    expect(parseApiInt(0)).toBe(0);
  });

  it("parses integer strings", () => {
    expect(parseApiInt("42")).toBe(42);
    expect(parseApiInt(" 7 ")).toBe(7);
  });

  it("returns undefined for invalid values", () => {
    expect(parseApiInt(Number.NaN)).toBeUndefined();
    expect(parseApiInt("")).toBeUndefined();
    expect(parseApiInt("abc")).toBeUndefined();
    expect(parseApiInt(null)).toBeUndefined();
    expect(parseApiInt({})).toBeUndefined();
  });
});
