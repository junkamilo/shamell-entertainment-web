/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("../lib/peticionesDateUtils", () => ({
  bookingTimeZone: () => "America/New_York",
}));

vi.mock("./usePeticionesContactActions", () => ({
  usePeticionesContactActions: () => ({
    onReserveFromContact: vi.fn(),
    confirmRemoveContact: vi.fn(),
  }),
}));

vi.mock("./usePeticionesBookingActions", () => ({
  usePeticionesBookingActions: () => ({
    onCancelBooking: vi.fn(),
    onRemoveBooking: vi.fn(),
  }),
}));

import { usePeticionesActions } from "./usePeticionesActions";

describe("usePeticionesActions", () => {
  it("merges contact and booking actions with bookingTz", () => {
    const { result } = renderHook(() =>
      usePeticionesActions({
        unifiedRows: [],
        reloadPeticiones: vi.fn(),
        contact: {
          remove: vi.fn(),
          setStatus: vi.fn(),
          reloadContacts: vi.fn(),
        },
        bookings: {
          createBooking: vi.fn(),
          patchBooking: vi.fn(),
          removeBooking: vi.fn(),
          reloadBookings: vi.fn(),
          createBookingQuote: vi.fn(),
          sendBalanceLink: vi.fn(),
        },
        catalog: {
          serviceByInquiryCode: new Map(),
          eventTypeContactCodeById: new Map(),
          inquiryCodeByCatalogLineId: new Map(),
        },
        setBusyId: vi.fn(),
        setReservingContactId: vi.fn(),
        setExpandedId: vi.fn(),
        setConfirmDelete: vi.fn(),
        setPurgeLinkedInquiryOnDelete: vi.fn(),
      }),
    );

    expect(result.current.bookingTz).toBe("America/New_York");
    expect(result.current.onReserveFromContact).toBeTypeOf("function");
    expect(result.current.onCancelBooking).toBeTypeOf("function");
  });
});
