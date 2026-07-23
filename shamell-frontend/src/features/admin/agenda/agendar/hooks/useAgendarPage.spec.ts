/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { validAgendarFormValues } from "../tests/fixtures/formValues.fixture";
import { FIXTURE_BOOKING_ID } from "../tests/fixtures/uuids.fixture";
import { sampleAgendarCatalog } from "../tests/fixtures/catalog.fixture";
import type { AgendarFormState } from "../types/agendarFormState.types";

const toastMock = vi.fn();
const push = vi.fn();
const createBooking = vi.fn(async () => undefined);
const patchBooking = vi.fn(async () => undefined);
const clearNotes = vi.fn();

let params = new URLSearchParams();
let formState: AgendarFormState;

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  useSearchParams: () => ({
    get: (key: string) => params.get(key),
    toString: () => params.toString(),
  }),
}));

vi.mock("@/hooks/use-admin-bookings", () => ({
  useAdminBookings: () => ({ createBooking, patchBooking }),
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

vi.mock("./useAgendarCatalog", () => ({
  useAgendarCatalog: () => ({
    catalogLoading: false,
    catalog: sampleAgendarCatalog,
  }),
}));

vi.mock("./useAgendarAvailability", () => ({
  useAgendarAvailability: () => ({
    bookingTz: "America/New_York",
    blockedIsoDates: new Set(),
    blockedReasonByIso: new Map(),
    startTimeClamp: undefined,
    minSelectableIso: "2026-07-01",
  }),
}));

vi.mock("./useAgendarOccupiedRanges", () => ({
  useAgendarOccupiedRanges: () => ({ occupiedRanges: [] }),
}));

vi.mock("./useAgendarEditPrefill", () => ({
  useAgendarEditPrefill: () => ({ editLoading: false }),
}));

vi.mock("./useAgendarQueryPrefill", () => ({
  useAgendarQueryPrefill: vi.fn(),
}));

vi.mock("./useAgendarFormState", () => ({
  useAgendarFormState: () => formState,
}));

vi.mock("@/lib/bookingAvailability", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/bookingAvailability")>();
  return {
    ...actual,
    utcInstantForWallClock: vi.fn(() => new Date("2026-08-15T22:00:00.000Z")),
  };
});

import { useAgendarPage } from "./useAgendarPage";

function makeForm(overrides: Partial<AgendarFormState> = {}): AgendarFormState {
  return {
    ...validAgendarFormValues,
    linkedContactRequestId: "",
    datePickerOpen: false,
    timePickerWhich: null,
    mobileSectionModal: null,
    mobileSectionStatus: { event: true, logistics: true, client: true },
    setServiceIds: vi.fn(),
    setEventTypeId: vi.fn(),
    setOccasionTypeId: vi.fn(),
    setEventDateIso: vi.fn(),
    setEventTimeStart: vi.fn(),
    setEventTimeEnd: vi.fn(),
    setLocation: vi.fn(),
    setGuestFullName: vi.fn(),
    setGuestEmail: vi.fn(),
    setGuestPhone: vi.fn(),
    setGuestCount: vi.fn(),
    setNotes: vi.fn(),
    setLinkedContactRequestId: vi.fn(),
    setMobileSectionModal: vi.fn(),
    setDatePickerOpen: vi.fn(),
    setTimePickerWhich: vi.fn(),
    clearNotesAndGuestCountAfterSubmit: clearNotes,
    ...overrides,
  };
}

function makeEvent(): React.FormEvent {
  return { preventDefault: vi.fn() } as unknown as React.FormEvent;
}

describe("useAgendarPage", () => {
  beforeEach(() => {
    toastMock.mockClear();
    push.mockClear();
    createBooking.mockClear();
    patchBooking.mockClear();
    clearNotes.mockClear();
    params = new URLSearchParams();
    formState = makeForm();
  });

  it("exposes create mode by default", () => {
    const { result } = renderHook(() => useAgendarPage());
    expect(result.current.isEditMode).toBe(false);
    expect(result.current.catalogLoading).toBe(false);
    expect(result.current.isMobileLayout).toBe(false);
  });

  it("detects edit mode from bookingId", () => {
    params.set("bookingId", FIXTURE_BOOKING_ID);
    const { result } = renderHook(() => useAgendarPage());
    expect(result.current.isEditMode).toBe(true);
  });

  it("toasts and skips create when the form is invalid", async () => {
    formState = makeForm({ guestFullName: "" });
    const { result } = renderHook(() => useAgendarPage());

    await act(async () => {
      await result.current.onSubmit(makeEvent());
    });

    expect(createBooking).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive" }),
    );
  });

  it("creates a booking and navigates on success", async () => {
    const { result } = renderHook(() => useAgendarPage());

    await act(async () => {
      await result.current.onSubmit(makeEvent());
    });

    expect(createBooking).toHaveBeenCalledOnce();
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Booking created" }));
    expect(clearNotes).toHaveBeenCalledOnce();
    expect(push).toHaveBeenCalledWith(expect.stringContaining("updated=1"));
  });

  it("patches when editing an existing booking", async () => {
    params.set("bookingId", FIXTURE_BOOKING_ID);
    const { result } = renderHook(() => useAgendarPage());

    await act(async () => {
      await result.current.onSubmit(makeEvent());
    });

    expect(patchBooking).toHaveBeenCalledWith(FIXTURE_BOOKING_ID, expect.any(Object));
    expect(createBooking).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Booking updated" }));
  });

  it("rejects end time before start time", async () => {
    formState = makeForm({ eventTimeStart: "20:00", eventTimeEnd: "18:00" });
    const { result } = renderHook(() => useAgendarPage());

    await act(async () => {
      await result.current.onSubmit(makeEvent());
    });

    expect(createBooking).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "End time must be after start time" }),
    );
  });

  it("passes contactRequestId when linked from inbox", async () => {
    formState = makeForm({ linkedContactRequestId: "contact-req-1" });
    const { result } = renderHook(() => useAgendarPage());

    await act(async () => {
      await result.current.onSubmit(makeEvent());
    });

    expect(createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        contactRequestId: "contact-req-1",
        source: "ADMIN_FROM_CONTACT",
      }),
    );
  });

  it("toasts when createBooking fails", async () => {
    createBooking.mockRejectedValueOnce(new Error("network down"));
    const { result } = renderHook(() => useAgendarPage());

    await act(async () => {
      await result.current.onSubmit(makeEvent());
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Error",
        description: "network down",
        variant: "destructive",
      }),
    );
    expect(result.current.submitting).toBe(false);
  });

  it("appends updated=1 to returnTo that already has a query", async () => {
    params.set("returnTo", "/admin/agenda/peticiones?lane=bookings");
    const { result } = renderHook(() => useAgendarPage());

    await act(async () => {
      await result.current.onSubmit(makeEvent());
    });

    expect(push).toHaveBeenCalledWith("/admin/agenda/peticiones?lane=bookings&updated=1");
  });
});
