/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { AdminBookingRow } from "@/hooks/use-admin-bookings";
import { usePeticionesBookingActions } from "./usePeticionesBookingActions";

const toastMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

function makeBooking(overrides: Partial<AdminBookingRow> = {}): AdminBookingRow {
  return {
    id: "booking-1",
    status: "CONFIRMED",
    ...overrides,
  } as AdminBookingRow;
}

describe("usePeticionesBookingActions", () => {
  const patchBooking = vi.fn(async () => undefined);
  const removeBooking = vi.fn(async () => undefined);
  const reloadBookings = vi.fn();
  const reloadPeticiones = vi.fn();
  const createBookingQuote = vi.fn(async () => undefined);
  const sendBalanceLink = vi.fn(async () => undefined);
  const setBusyId = vi.fn();
  const setExpandedId = vi.fn();
  const setConfirmDelete = vi.fn();
  const setPurgeLinkedInquiryOnDelete = vi.fn();

  beforeEach(() => {
    toastMock.mockClear();
    patchBooking.mockClear();
    removeBooking.mockClear();
    reloadBookings.mockClear();
    reloadPeticiones.mockClear();
    createBookingQuote.mockClear();
    sendBalanceLink.mockClear();
    setBusyId.mockClear();
    setExpandedId.mockClear();
    setConfirmDelete.mockClear();
    setPurgeLinkedInquiryOnDelete.mockClear();
  });

  function renderActions() {
    return renderHook(() =>
      usePeticionesBookingActions({
        unifiedRows: [],
        reloadPeticiones,
        patchBooking,
        removeBooking,
        reloadBookings,
        createBookingQuote,
        sendBalanceLink,
        setBusyId,
        setExpandedId,
        setConfirmDelete,
        setPurgeLinkedInquiryOnDelete,
      }),
    );
  }

  it("cancels a booking and reloads", async () => {
    const { result } = renderActions();
    await act(async () => {
      await result.current.onCancelBooking(makeBooking());
    });
    expect(patchBooking).toHaveBeenCalledWith("booking-1", { status: "CANCELLED" });
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Booking canceled" }));
    expect(reloadBookings).toHaveBeenCalled();
    expect(reloadPeticiones).toHaveBeenCalled();
    expect(setBusyId).toHaveBeenCalledWith(null);
  });

  it("blocks remove unless the booking is cancelled", () => {
    const { result } = renderActions();
    act(() => {
      result.current.onRemoveBooking(makeBooking({ status: "CONFIRMED" }));
    });
    expect(setConfirmDelete).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Action not allowed" }),
    );
  });

  it("opens confirm delete for a cancelled booking", () => {
    const { result } = renderActions();
    act(() => {
      result.current.onRemoveBooking(makeBooking({ status: "CANCELLED" }));
    });
    expect(setConfirmDelete).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "BOOKING", id: "booking-1" }),
    );
  });

  it("sends a quote and reloads", async () => {
    const { result } = renderActions();
    await act(async () => {
      await result.current.onSendBookingQuote(makeBooking(), {
        paymentModel: "FULL",
        totalAmount: 200,
      });
    });
    expect(createBookingQuote).toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Payment link sent" }),
    );
  });

  it("confirmRemoveBooking purges linked contact when requested", async () => {
    const { result } = renderActions();
    await act(async () => {
      await result.current.confirmRemoveBooking("booking-1", "contact-1", true);
    });
    expect(removeBooking).toHaveBeenCalledWith("booking-1", { purgeContact: true });
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Booking deleted" }));
  });
});
