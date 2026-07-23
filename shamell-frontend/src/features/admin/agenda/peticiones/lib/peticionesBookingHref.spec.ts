import { describe, expect, it } from "vitest";
import type { AdminBookingRow } from "@/hooks/use-admin-bookings";
import { AGENDAR_PATH, AGENDA_PETICIONES_PATH } from "./peticionesRoutes";
import { buildBookingEditHref } from "./peticionesBookingHref";

function row(overrides: Partial<AdminBookingRow> = {}): AdminBookingRow {
  return {
    id: "booking-1",
    eventDate: "2026-08-15T14:00:00.000Z",
    guestFullName: "Ada",
    guestEmail: "ada@example.com",
    guestPhone: "555",
    location: "Studio",
    notes: "x".repeat(600),
    service: { id: "svc-1" },
    eventType: { id: "et-1" },
    occasionType: { id: "oc-1" },
    bookingDetails: { eventTimeStart: "10:00", eventTimeEnd: "12:00" },
    ...overrides,
  } as AdminBookingRow;
}

describe("buildBookingEditHref", () => {
  it("builds an Agendar edit URL with booking origin and returnTo", () => {
    const href = buildBookingEditHref(row(), "UTC");
    const url = new URL(href, "http://localhost");
    expect(href.startsWith(AGENDAR_PATH)).toBe(true);
    expect(url.searchParams.get("origin")).toBe("booking");
    expect(url.searchParams.get("bookingId")).toBe("booking-1");
    expect(url.searchParams.get("returnTo")).toBe(AGENDA_PETICIONES_PATH);
    expect(url.searchParams.get("fullName")).toBe("Ada");
    expect(url.searchParams.get("start")).toBe("10:00");
    expect(url.searchParams.get("end")).toBe("12:00");
    expect(url.searchParams.get("serviceId")).toBe("svc-1");
    expect(url.searchParams.get("message")?.length).toBe(500);
  });

  it("omits empty optional fields", () => {
    const href = buildBookingEditHref(
      row({
        guestPhone: "",
        notes: "",
        location: "",
        service: undefined,
        eventType: undefined,
        occasionType: undefined,
      }),
      "UTC",
    );
    const url = new URL(href, "http://localhost");
    expect(url.searchParams.get("phone")).toBeNull();
    expect(url.searchParams.get("message")).toBeNull();
    expect(url.searchParams.get("location")).toBeNull();
    expect(url.searchParams.get("serviceId")).toBeNull();
  });
});
