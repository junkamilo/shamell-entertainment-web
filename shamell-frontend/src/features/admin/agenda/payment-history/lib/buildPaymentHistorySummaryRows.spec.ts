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

  it("builds purchase rows for fixed ticket package details", () => {
    const rows = buildPurchaseRows(row({ flow: "FIXED_TICKET" }), {
      purchaseDetails: {
        flow: "FIXED_TICKET",
        eventName: "Rhythm Night",
        eventDate: "2026-09-01T00:00:00.000Z",
        ticketNumber: 7,
        packageTitle: "VIP Early Entry",
        packageArrivalLabel: "7:00 PM",
        packageIncludes: ["Workshop", "Show"],
        verificationCode: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      },
    } as AdminStripePaymentDetail);
    expect(rows.find((r) => r.label === "PACKAGE")?.value).toBe("VIP Early Entry");
    expect(rows.find((r) => r.label === "INCLUDES")?.value).toBe("Workshop, Show");
    expect(rows.find((r) => r.label === "VERIFICATION CODE")?.value).toBe(
      "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    );
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
