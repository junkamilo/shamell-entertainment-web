import { vi } from "vitest";
import type { BookClassFormState } from "../../hooks/useBookClassFormState";
import type { PrivateClassFormFields } from "../../types/privateClass.types";

const EMPTY_PRIVATE_FIELDS: PrivateClassFormFields = {
  classType: "",
  eventDate: "",
  eventTimeStart: "",
  location: "",
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  notes: "",
  amountUsd: "",
  paymentMethod: "stripe",
  cashConfirmed: false,
};

export function createMockPrivateClassFormReturn(
  overrides: {
    fields?: Partial<PrivateClassFormFields>;
    submitting?: boolean;
    datePickerOpen?: boolean;
    timePickerOpen?: boolean;
    patch?: ReturnType<typeof vi.fn>;
    setPaymentMethod?: ReturnType<typeof vi.fn>;
    setDatePickerOpen?: ReturnType<typeof vi.fn>;
    setTimePickerOpen?: ReturnType<typeof vi.fn>;
    onSubmit?: ReturnType<typeof vi.fn>;
  } = {},
) {
  const { fields: fieldOverrides, ...rest } = overrides;
  return {
    fields: { ...EMPTY_PRIVATE_FIELDS, ...fieldOverrides },
    patch: vi.fn(),
    setPaymentMethod: vi.fn(),
    submitting: false,
    datePickerOpen: false,
    setDatePickerOpen: vi.fn(),
    timePickerOpen: false,
    setTimePickerOpen: vi.fn(),
    onSubmit: vi.fn((e: { preventDefault: () => void }) => e.preventDefault()),
    ...rest,
  };
}

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
