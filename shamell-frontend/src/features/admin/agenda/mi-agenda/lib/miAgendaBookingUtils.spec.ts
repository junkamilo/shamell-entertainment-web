import { describe, expect, it, vi } from "vitest";
import type { AdminBookingRow } from "@/hooks/use-admin-bookings";
import {
  displayName,
  durationLabel,
  enrichBookings,
  eventTypeLabel,
  readBookingTime,
} from "./miAgendaBookingUtils";

vi.mock("@/lib/adminBookingDisplay", () => ({
  bookingServiceChip: () => "Service chip",
}));

function row(overrides: Partial<AdminBookingRow> = {}): AdminBookingRow {
  return {
    id: "b1",
    eventDate: "2026-08-15T14:00:00.000Z",
    guestFullName: "Guest Name",
    ...overrides,
  } as AdminBookingRow;
}

describe("miAgendaBookingUtils", () => {
  it("prefers user name then guest name", () => {
    expect(displayName(row({ user: { fullName: "User Name" } as never }))).toBe(
      "User Name",
    );
    expect(displayName(row({ guestFullName: "Guest Name" }))).toBe("Guest Name");
    expect(displayName(row({ guestFullName: "  ", user: null as never }))).toBe(
      "Unnamed guest",
    );
  });

  it("reads times from bookingDetails when valid", () => {
    expect(
      readBookingTime(
        row({
          bookingDetails: { eventTimeStart: "10:30", eventTimeEnd: "11:45" },
        }),
        "UTC",
      ),
    ).toEqual({ start: "10:30", end: "11:45" });
  });

  it("falls back end to start when end is missing", () => {
    const times = readBookingTime(
      row({ bookingDetails: { eventTimeStart: "09:00" } }),
      "UTC",
    );
    expect(times.start).toBe("09:00");
    expect(times.end).toBe("09:00");
  });

  it("resolves event type label fallbacks", () => {
    expect(eventTypeLabel(row({ event: { name: "Show" } as never }))).toBe("Show");
    expect(
      eventTypeLabel(row({ eventType: { name: "Type" } as never })),
    ).toBe("Type");
    expect(eventTypeLabel(row())).toBe("—");
  });

  it("formats duration labels", () => {
    expect(durationLabel(45)).toBe("45m");
    expect(durationLabel(120)).toBe("2h");
    expect(durationLabel(90)).toBe("1h 30m");
  });

  it("enriches and sorts bookings", () => {
    const enriched = enrichBookings(
      [
        row({
          id: "b2",
          eventDate: "2026-08-16T14:00:00.000Z",
          bookingDetails: { eventTimeStart: "08:00", eventTimeEnd: "09:00" },
        }),
        row({
          id: "b1",
          eventDate: "2026-08-16T14:00:00.000Z",
          bookingDetails: { eventTimeStart: "10:00", eventTimeEnd: "11:00" },
        }),
        row({
          id: "b0",
          eventDate: "2026-08-15T14:00:00.000Z",
          bookingDetails: { eventTimeStart: "12:00", eventTimeEnd: "13:00" },
        }),
      ],
      "UTC",
    );
    expect(enriched.map((b) => b.id)).toEqual(["b0", "b2", "b1"]);
    expect(enriched[0].durationM).toBe(60);
  });
});
