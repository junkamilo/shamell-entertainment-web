import { describe, expect, it } from "vitest";
import type {
  AdminStripePaymentDetail,
  AdminStripePaymentRow,
} from "../types/paymentHistory.types";
import {
  buildCustomerRows,
  buildPaymentRows,
  buildPurchaseRows,
} from "./buildPaymentHistorySummaryRows";

function row(overrides: Partial<AdminStripePaymentRow> = {}): AdminStripePaymentRow {
  return {
    id: "pay-1",
    flow: "BOOKING_QUOTE",
    customerName: "Ada",
    customerEmail: "ada@example.com",
    amount: 100,
    currency: "usd",
    stage: "FULL",
    status: "PENDING",
    paidAt: null,
    createdAt: "2026-08-01T12:00:00.000Z",
    expiresAt: "2026-08-02T12:00:00.000Z",
    contextLabel: "Private event",
    ...overrides,
  } as AdminStripePaymentRow;
}

describe("buildPaymentHistorySummaryRows", () => {
  it("builds customer rows and optional phone from detail", () => {
    expect(buildCustomerRows(row()).map((r) => r.label)).toEqual(["NAME", "EMAIL"]);
    expect(
      buildCustomerRows(row(), {
        customerPhone: "555-0100",
      } as AdminStripePaymentDetail).map((r) => r.label),
    ).toEqual(["NAME", "EMAIL", "PHONE"]);
  });

  it("builds purchase rows for booking quote details", () => {
    const rows = buildPurchaseRows(row(), {
      purchaseDetails: {
        flow: "BOOKING_QUOTE",
        eventType: "Show",
        occasion: "Birthday",
        services: "Dance",
        location: "Hall",
        guestCount: 20,
        quoteTotalAmount: 500,
        quoteDepositAmount: 100,
        quoteModel: "DEPOSIT",
      },
    } as AdminStripePaymentDetail);
    expect(rows.find((r) => r.label === "FLOW")?.value).toBe("Book");
    expect(rows.find((r) => r.label === "CONTEXT")?.value).toBe("Private event");
    expect(rows.find((r) => r.label === "GUESTS")?.value).toBe("20");
    expect(rows.find((r) => r.label === "QUOTE TOTAL")?.value).toBe("$500.00");
  });

  it("maps venue seat kind to Chair/Table", () => {
    const rows = buildPurchaseRows(row({ flow: "VENUE_SEAT" }), {
      purchaseDetails: {
        flow: "VENUE_SEAT",
        eventName: "Night",
        seatKind: "CHAIR",
        tableName: "T1",
      },
    } as AdminStripePaymentDetail);
    expect(rows.find((r) => r.label === "SEAT TYPE")?.value).toBe("Chair");
  });

  it("builds payment rows and includes expires only while pending", () => {
    const pending = buildPaymentRows(row());
    expect(pending.find((r) => r.label === "EXPIRES")).toBeTruthy();
    const paid = buildPaymentRows(
      row({ status: "PAID", paidAt: "2026-08-01T13:00:00.000Z" }),
    );
    expect(paid.find((r) => r.label === "EXPIRES")).toBeUndefined();
    expect(paid.find((r) => r.label === "PAID")).toBeTruthy();
  });
});
