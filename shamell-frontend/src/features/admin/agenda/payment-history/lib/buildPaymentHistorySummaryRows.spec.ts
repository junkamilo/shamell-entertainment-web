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

  it("maps table seats, class sessions, and fixed tickets", () => {
    expect(
      buildPurchaseRows(row({ flow: "VENUE_SEAT" }), {
        purchaseDetails: {
          flow: "VENUE_SEAT",
          eventName: "Night",
          eventDate: "2030-08-01",
          seatKind: "TABLE",
          tableName: "T1",
          layoutItemId: "lay-1",
        },
      } as AdminStripePaymentDetail).find((r) => r.label === "SEAT TYPE")?.value,
    ).toBe("Table");

    const classRows = buildPurchaseRows(row({ flow: "CLASS_SESSION" }), {
      purchaseDetails: {
        flow: "CLASS_SESSION",
        eventName: "Bachata",
        sessionStartsAt: "2030-08-04T23:00:00.000Z",
        sessionEndsAt: "2030-08-05T00:00:00.000Z",
        sessionTimezone: "America/New_York",
      },
    } as AdminStripePaymentDetail);
    expect(classRows.find((r) => r.label === "CLASS")?.value).toBe("Bachata");
    expect(classRows.find((r) => r.label === "SESSION")?.value).toMatch(/–/);

    expect(
      buildPurchaseRows(row({ flow: "CLASS_SESSION" }), {
        purchaseDetails: {
          flow: "CLASS_SESSION",
          eventName: "Bachata",
          sessionStartsAt: "not-a-date",
          sessionEndsAt: "2030-08-05T00:00:00.000Z",
          sessionTimezone: "America/New_York",
        },
      } as AdminStripePaymentDetail).find((r) => r.label === "SESSION")?.value,
    ).toBe("not-a-date");

    expect(
      buildPurchaseRows(row({ flow: "CLASS_SESSION" }), {
        purchaseDetails: {
          flow: "CLASS_SESSION",
          eventName: "Bachata",
          sessionStartsAt: "2030-08-04T23:00:00.000Z",
          sessionEndsAt: "nope",
          sessionTimezone: "America/New_York",
        },
      } as AdminStripePaymentDetail).find((r) => r.label === "SESSION")?.value,
    ).toBeTruthy();

    const ticket = buildPurchaseRows(row({ flow: "FIXED_TICKET" }), {
      purchaseDetails: {
        flow: "FIXED_TICKET",
        eventName: "Gala",
        eventDate: "2030-08-01",
        ticketNumber: 12,
      },
    } as AdminStripePaymentDetail);
    expect(ticket.find((r) => r.label === "TICKET #")?.value).toBe("12");
    expect(
      buildPurchaseRows(row({ flow: "FIXED_TICKET" }), {
        purchaseDetails: {
          flow: "FIXED_TICKET",
          eventName: "Gala",
          eventDate: null,
          ticketNumber: null,
        },
      } as AdminStripePaymentDetail).find((r) => r.label === "TICKET #"),
    ).toBeUndefined();
  });

  it("skips empty optional quote fields and duplicate labels", () => {
    const rows = buildPurchaseRows(row({ contextLabel: "EVENT TYPE" }), {
      purchaseDetails: {
        flow: "BOOKING_QUOTE",
        eventType: "Show",
        occasion: null,
        services: null,
        eventDate: "2030-08-01",
        location: null,
        guestCount: 0,
        quoteTotalAmount: 0,
        quoteDepositAmount: 0,
        quoteModel: null,
      },
    } as AdminStripePaymentDetail);
    expect(rows.filter((r) => r.label === "EVENT TYPE")).toHaveLength(1);
    expect(rows.find((r) => r.label === "GUESTS")).toBeUndefined();
    expect(buildPurchaseRows(row()).find((r) => r.label === "EVENT TYPE")).toBeUndefined();
  });

  it("omits blank payment method labels", () => {
    expect(
      buildPaymentRows(row({ paymentMethodLabel: null })).find((r) => r.label === "PAYMENT METHOD"),
    ).toBeUndefined();
    expect(
      buildPaymentRows(row({ paymentMethodLabel: "Visa" })).find((r) => r.label === "PAYMENT METHOD")
        ?.value,
    ).toBe("Visa");
  });
});
