import { describe, expect, it } from "vitest";
import {
  buildBulkVenueTablePayload,
  buildVenueTablePayload,
} from "./buildVenueTablePayload";
import { BULK_TABLE_MAX_QUANTITY } from "../types/venueTables.types";

describe("buildVenueTablePayload", () => {
  it("builds payload with clamped chairs and parsed price", () => {
    const result = buildVenueTablePayload({
      size: "LARGE",
      includedChairs: 20,
      bundlePriceInput: "250.50",
      isActive: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload).toEqual({
      size: "LARGE",
      includedChairs: 8,
      bundlePrice: 250.5,
      isActive: true,
    });
  });

  it("includes visual coordinates when provided", () => {
    const result = buildVenueTablePayload({
      size: "MEDIUM",
      includedChairs: 4,
      bundlePriceInput: "180",
      visualCoordinates: { x: 10, y: 20 },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.visualX).toBe(10);
    expect(result.payload.visualY).toBe(20);
  });

  it("rejects missing bundle price", () => {
    const result = buildVenueTablePayload({
      size: "SMALL",
      includedChairs: 3,
      bundlePriceInput: "",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContain(
      "Bundle price is required and must be a valid amount.",
    );
  });
});

describe("buildBulkVenueTablePayload", () => {
  it("builds bulk payload when inputs are valid", () => {
    const result = buildBulkVenueTablePayload({
      quantity: 5,
      size: "LARGE",
      includedChairs: 6,
      bundlePriceInput: "200",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload).toEqual({
      quantity: 5,
      size: "LARGE",
      includedChairs: 6,
      bundlePrice: 200,
    });
  });

  it("rejects quantity out of range", () => {
    const result = buildBulkVenueTablePayload({
      quantity: BULK_TABLE_MAX_QUANTITY + 1,
      size: "LARGE",
      includedChairs: 6,
      bundlePriceInput: "200",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toMatch(/Quantity must be between/);
  });

  it("rejects invalid bundle price", () => {
    const result = buildBulkVenueTablePayload({
      quantity: 2,
      size: "SMALL",
      includedChairs: 3,
      bundlePriceInput: "-5",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContain(
      "Bundle price is required and must be a valid amount.",
    );
  });
});
