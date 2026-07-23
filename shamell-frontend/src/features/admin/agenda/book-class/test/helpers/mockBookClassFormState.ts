import { vi } from "vitest";
import type { BookClassFormState } from "../../hooks/useBookClassFormState";

export function createMockBookClassFormState(
  initial: Partial<Record<keyof BookClassFormState, unknown>> = {},
): BookClassFormState & { calls: Record<string, unknown[]> } {
  const calls: Record<string, unknown[]> = {};

  function track(name: string) {
    return vi.fn((value?: unknown) => {
      if (!calls[name]) calls[name] = [];
      calls[name].push(value);
    });
  }

  return {
    calls,
    eventId: "",
    setEventId: track("setEventId"),
    bookingKind: "day",
    setBookingKind: track("setBookingKind"),
    weekday: null,
    setWeekday: track("setWeekday"),
    selectedDateIso: null,
    setSelectedDateIso: track("setSelectedDateIso"),
    selectedSessionIds: new Set<string>(),
    setSelectedSessionIds: track("setSelectedSessionIds"),
    toggleSessionId: track("toggleSessionId"),
    monthIso: null,
    setMonthIso: track("setMonthIso"),
    customerName: "",
    setCustomerName: track("setCustomerName"),
    customerEmail: "",
    setCustomerEmail: track("setCustomerEmail"),
    customerPhone: "",
    setCustomerPhone: track("setCustomerPhone"),
    paymentMethod: "stripe",
    setPaymentMethod: track("setPaymentMethod"),
    cashConfirmed: false,
    setCashConfirmed: track("setCashConfirmed"),
    resetAfterSubmit: track("resetAfterSubmit"),
    resetForEventChange: track("resetForEventChange"),
    ...initial,
  } as BookClassFormState & { calls: Record<string, unknown[]> };
}
