import { describe, expect, it } from "vitest";
import type { AdminBookingRow } from "@/hooks/use-admin-bookings";
import {
  canSendInitialPaymentLink,
  paymentCardBadge,
  paymentCardBorderClass,
  resolveBookingPaymentCardState,
} from "./peticionesPaymentCardState";

function booking(
  overrides: Partial<
    Pick<
      AdminBookingRow,
      "status" | "depositPaidAt" | "balancePaidAt" | "quoteSentAt" | "quoteModel"
    >
  > = {},
) {
  return {
    status: "PENDING",
    depositPaidAt: null,
    balancePaidAt: null,
    quoteSentAt: null,
    quoteModel: null,
    ...overrides,
  } as Pick<
    AdminBookingRow,
    "status" | "depositPaidAt" | "balancePaidAt" | "quoteSentAt" | "quoteModel"
  >;
}

describe("resolveBookingPaymentCardState", () => {
  it("resolves cancelled first", () => {
    expect(
      resolveBookingPaymentCardState(
        booking({
          status: "CANCELLED",
          balancePaidAt: "2026-01-01",
        }),
      ),
    ).toBe("cancelled");
  });

  it("resolves deposit partial before full paid", () => {
    expect(
      resolveBookingPaymentCardState(
        booking({
          depositPaidAt: "2026-01-01",
          balancePaidAt: null,
        }),
      ),
    ).toBe("deposit_partial");
  });

  it("resolves paid full from balance or confirmed FULL quote", () => {
    expect(
      resolveBookingPaymentCardState(booking({ balancePaidAt: "2026-01-02" })),
    ).toBe("paid_full");
    expect(
      resolveBookingPaymentCardState(
        booking({ status: "CONFIRMED", quoteModel: "FULL" }),
      ),
    ).toBe("paid_full");
  });

  it("resolves payment in progress vs awaiting", () => {
    expect(
      resolveBookingPaymentCardState(
        booking({
          status: "PENDING",
          quoteSentAt: "2026-01-01",
        }),
      ),
    ).toBe("payment_in_progress");
    expect(resolveBookingPaymentCardState(booking())).toBe("awaiting_payment");
  });
});

describe("payment card helpers", () => {
  it("blocks initial payment link when paid or cancelled", () => {
    expect(
      canSendInitialPaymentLink(booking({ status: "CANCELLED" })),
    ).toBe(false);
    expect(
      canSendInitialPaymentLink(booking({ balancePaidAt: "2026-01-01" })),
    ).toBe(false);
    expect(canSendInitialPaymentLink(booking())).toBe(true);
  });

  it("returns badge and border styles per visual", () => {
    expect(paymentCardBadge("paid_full").label).toBe("PAID");
    expect(paymentCardBadge("awaiting_payment").label).toBe("AWAITING PAYMENT");
    expect(paymentCardBorderClass("deposit_partial")).toContain("orange");
    expect(paymentCardBorderClass("payment_in_progress")).toContain("cyan");
  });
});
