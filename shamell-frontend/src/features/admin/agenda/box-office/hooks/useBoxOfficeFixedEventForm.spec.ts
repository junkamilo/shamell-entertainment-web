/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { makeFixedTicketEvent } from "../test/fixtures/boxOffice.fixture";
import { FIXTURE_FIXED_EVENT_ID } from "../test/fixtures/uuids.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");
const fetchEventsMock = vi.fn(async () => [makeFixedTicketEvent()]);
const cashMock = vi.fn(async () => ({ ok: true as const, message: "Ticket reserved." }));
const checkoutMock = vi.fn(async () => ({ ok: true as const, message: "Payment link sent." }));

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

vi.mock("../services/fetchBoxOfficeFixedEvents", () => ({
  fetchBoxOfficeFixedEvents: (...args: unknown[]) => fetchEventsMock(...args),
}));

vi.mock("../services/createBoxOfficeFixedTicket", () => ({
  createBoxOfficeFixedTicketCash: (...args: unknown[]) => cashMock(...args),
  createBoxOfficeFixedTicketCheckout: (...args: unknown[]) => checkoutMock(...args),
}));

import { useBoxOfficeFixedEventForm } from "./useBoxOfficeFixedEventForm";

function makeFormEvent(): React.FormEvent {
  return { preventDefault: vi.fn() } as unknown as React.FormEvent;
}

describe("useBoxOfficeFixedEventForm", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
    fetchEventsMock.mockClear();
    fetchEventsMock.mockResolvedValue([makeFixedTicketEvent()]);
    cashMock.mockClear();
    cashMock.mockResolvedValue({ ok: true, message: "Ticket reserved." });
    checkoutMock.mockClear();
    checkoutMock.mockResolvedValue({ ok: true, message: "Payment link sent." });
  });

  it("loads fixed events on mount", async () => {
    const { result } = renderHook(() => useBoxOfficeFixedEventForm());

    await waitFor(() => expect(result.current.eventsLoading).toBe(false));
    expect(fetchEventsMock).toHaveBeenCalledWith("token-1");
    expect(result.current.events).toEqual([makeFixedTicketEvent()]);
    expect(result.current.eventsError).toBeNull();
  });

  it("requires a name and email before submitting", async () => {
    const { result } = renderHook(() => useBoxOfficeFixedEventForm());
    await waitFor(() => expect(result.current.eventsLoading).toBe(false));

    act(() => {
      result.current.onSelectEvent(FIXTURE_FIXED_EVENT_ID);
    });

    await act(async () => {
      await result.current.onSubmit(makeFormEvent());
    });

    expect(result.current.formError).toBe("Name and email are required.");
    expect(cashMock).not.toHaveBeenCalled();
    expect(checkoutMock).not.toHaveBeenCalled();
  });

  it("reserves a fixed ticket with cash and reloads events", async () => {
    const { result } = renderHook(() => useBoxOfficeFixedEventForm());
    await waitFor(() => expect(result.current.eventsLoading).toBe(false));

    act(() => {
      result.current.onSelectEvent(FIXTURE_FIXED_EVENT_ID);
      result.current.setCustomerName("Jane Doe");
      result.current.setCustomerEmail("jane@example.com");
      result.current.setCashConfirmed(true);
    });

    expect(result.current.paymentMethod).toBe("cash");

    await act(async () => {
      await result.current.onSubmit(makeFormEvent());
    });

    expect(cashMock).toHaveBeenCalledWith(
      "token-1",
      expect.objectContaining({
        upcomingEventId: FIXTURE_FIXED_EVENT_ID,
        customerName: "Jane Doe",
        customerEmail: "jane@example.com",
      }),
    );
    expect(checkoutMock).not.toHaveBeenCalled();
    expect(result.current.formError).toBeNull();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Ticket reserved" }),
    );
    // once on mount, once after the successful cash reservation
    expect(fetchEventsMock).toHaveBeenCalledTimes(2);
  });

  it("surfaces the error message when the cash reservation fails", async () => {
    cashMock.mockResolvedValueOnce({ ok: false, message: "Sold out" });
    const { result } = renderHook(() => useBoxOfficeFixedEventForm());
    await waitFor(() => expect(result.current.eventsLoading).toBe(false));

    act(() => {
      result.current.onSelectEvent(FIXTURE_FIXED_EVENT_ID);
      result.current.setCustomerName("Jane Doe");
      result.current.setCustomerEmail("jane@example.com");
      result.current.setCashConfirmed(true);
    });

    await act(async () => {
      await result.current.onSubmit(makeFormEvent());
    });

    expect(result.current.formError).toBe("Sold out");
    expect(toastMock).not.toHaveBeenCalled();
  });
});
