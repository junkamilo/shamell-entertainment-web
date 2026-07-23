import { describe, expect, it } from "vitest";
import {
  formatPaymentAmount,
  formatPaymentDate,
  flowLabel,
  stageLabel,
  statusLabel,
} from "./paymentHistoryDisplay";

describe("paymentHistoryDisplay", () => {
  it("maps flow labels", () => {
    expect(flowLabel("BOOKING_QUOTE")).toBe("Book");
    expect(flowLabel("VENUE_SEAT")).toBe("Venue");
    expect(flowLabel("CLASS_SESSION")).toBe("Class");
    expect(flowLabel("FIXED_TICKET")).toBe("Ticket");
  });

  it("maps stage labels", () => {
    expect(stageLabel(null)).toBe("—");
    expect(stageLabel("FULL")).toBe("Full");
    expect(stageLabel("DEPOSIT")).toBe("Deposit");
    expect(stageLabel("BALANCE")).toBe("Balance");
  });

  it("maps status labels", () => {
    expect(statusLabel("PAID")).toBe("Paid");
    expect(statusLabel("PENDING")).toBe("Pending");
    expect(statusLabel("EXPIRED")).toBe("Expired");
    expect(statusLabel("CANCELLED")).toBe("Cancelled");
  });

  it("formats amounts", () => {
    expect(formatPaymentAmount(12.5, "usd")).toBe("$12.50");
    expect(formatPaymentAmount(12.5, "eur")).toBe("12.50 EUR");
  });

  it("formats dates", () => {
    expect(formatPaymentDate(null)).toBe("—");
    expect(formatPaymentDate("2026-08-15T14:00:00.000Z").length).toBeGreaterThan(0);
  });
});
