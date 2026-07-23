import { describe, expect, it, vi } from "vitest";
import type { AdminBookingRow } from "@/hooks/use-admin-bookings";
import { buildAdminBookingDetailRows } from "./buildAdminBookingDetailRows";

vi.mock("@/lib/adminBookingDisplay", () => ({
  bookingServiceDisplayLine: () => "Fallback service",
}));

function booking(overrides: Partial<AdminBookingRow> = {}): AdminBookingRow {
  return {
    id: "b1",
    location: "Studio A",
    guestCount: 8,
    eventType: { name: "Show" },
    occasionType: { name: "Birthday" },
    eventDate: "2026-08-15T14:00:00.000Z",
    ...overrides,
  } as AdminBookingRow;
}

describe("buildAdminBookingDetailRows", () => {
  it("builds private class rows and returns early", () => {
    const rows = buildAdminBookingDetailRows(
      booking(),
      {
        kind: "private_class",
        classType: "Ballet",
        eventTimeStart: "10:00",
        paymentMethod: "cash",
        amountUsd: 150,
      },
      "UTC",
    );
    expect(rows.map((r) => r.label)).toEqual([
      "CLASS TYPE",
      "LOCATION",
      "START TIME",
      "PAYMENT",
      "PRICE",
    ]);
    expect(rows.find((r) => r.label === "PAYMENT")?.value).toBe("Cash");
    expect(rows.some((r) => r.label === "EVENT TYPE")).toBe(false);
  });

  it("builds standard booking rows from details and fallbacks", () => {
    const rows = buildAdminBookingDetailRows(
      booking(),
      {
        eventTypeLabel: "Gala",
        occasionSingleLabel: "Anniversary",
        serviceLabels: ["Dance", "", "Live music"],
        guestCount: 12,
        eventTimeStart: "18:00",
        eventTimeEnd: "21:00",
      },
      "UTC",
    );
    expect(rows.find((r) => r.label === "EVENT TYPE")?.value).toBe("Gala");
    expect(rows.find((r) => r.label === "OCCASION")?.value).toBe("Anniversary");
    expect(rows.find((r) => r.label === "SERVICES")?.value).toBe(
      "Dance · Live music",
    );
    expect(rows.find((r) => r.label === "NUMBER OF GUESTS")?.value).toBe("12");
    expect(rows.find((r) => r.label === "REQUESTED TIME")?.value).toBe(
      "18:00 – 21:00",
    );
  });

  it("falls back to booking service line when labels missing", () => {
    const rows = buildAdminBookingDetailRows(booking({ guestCount: 0 }), {}, "UTC");
    expect(rows.find((r) => r.label === "SERVICES")?.value).toBe("Fallback service");
    expect(rows.some((r) => r.label === "NUMBER OF GUESTS")).toBe(false);
  });
});
