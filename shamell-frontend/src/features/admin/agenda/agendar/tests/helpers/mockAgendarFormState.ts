import { vi } from "vitest";
import type { AgendarFormState } from "../../types/agendarFormState.types";

export function createMockAgendarFormState(
  initial: Partial<Record<keyof AgendarFormState, unknown>> = {},
): AgendarFormState & { calls: Record<string, unknown[]> } {
  const calls: Record<string, unknown[]> = {};

  function track(name: string) {
    return vi.fn((value: unknown) => {
      if (!calls[name]) calls[name] = [];
      calls[name].push(value);
    });
  }

  return {
    calls,
    serviceIds: [],
    eventTypeId: "",
    occasionTypeId: "",
    eventDateIso: "",
    eventTimeStart: "",
    eventTimeEnd: "",
    location: "",
    guestFullName: "",
    guestEmail: "",
    guestPhone: "",
    guestCount: "",
    notes: "",
    linkedContactRequestId: "",
    datePickerOpen: false,
    timePickerWhich: null,
    mobileSectionModal: null,
    mobileSectionStatus: { event: false, logistics: false, client: false },
    setServiceIds: track("setServiceIds"),
    setEventTypeId: track("setEventTypeId"),
    setOccasionTypeId: track("setOccasionTypeId"),
    setEventDateIso: track("setEventDateIso"),
    setEventTimeStart: track("setEventTimeStart"),
    setEventTimeEnd: track("setEventTimeEnd"),
    setLocation: track("setLocation"),
    setGuestFullName: track("setGuestFullName"),
    setGuestEmail: track("setGuestEmail"),
    setGuestPhone: track("setGuestPhone"),
    setGuestCount: track("setGuestCount"),
    setNotes: track("setNotes"),
    setLinkedContactRequestId: track("setLinkedContactRequestId"),
    setMobileSectionModal: track("setMobileSectionModal"),
    setDatePickerOpen: track("setDatePickerOpen"),
    setTimePickerWhich: track("setTimePickerWhich"),
    clearNotesAndGuestCountAfterSubmit: track("clearNotesAndGuestCountAfterSubmit"),
    ...initial,
  } as AgendarFormState & { calls: Record<string, unknown[]> };
}
