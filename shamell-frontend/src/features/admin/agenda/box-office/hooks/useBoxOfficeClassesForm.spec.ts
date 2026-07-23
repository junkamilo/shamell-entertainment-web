/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  makeBoxOfficeClassContext,
  makeBoxOfficeClassEventOption,
} from "../test/fixtures/boxOffice.fixture";
import {
  FIXTURE_CLASS_EVENT_ID,
  FIXTURE_SESSION_ID,
} from "../test/fixtures/uuids.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");
const fetchEventsMock = vi.fn(async () => ({
  ok: true as const,
  events: [makeBoxOfficeClassEventOption()],
}));
const fetchContextMock = vi.fn(async () => ({
  ok: true as const,
  context: makeBoxOfficeClassContext(),
}));
const cashMock = vi.fn(async () => ({
  ok: true as const,
  enrollmentId: "enr_1",
  message: "Class reserved.",
}));
const checkoutMock = vi.fn(async () => ({
  ok: true as const,
  enrollmentId: "enr_2",
  message: "Checkout ok",
  payUrl: "https://pay.test",
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

vi.mock("../services/fetchBoxOfficeClassEvents", () => ({
  fetchBoxOfficeClassEvents: (...args: unknown[]) => fetchEventsMock(...args),
}));

vi.mock("../services/fetchBoxOfficeClassContext", () => ({
  fetchBoxOfficeClassContext: (...args: unknown[]) => fetchContextMock(...args),
}));

vi.mock("../services/createBoxOfficeClassEnrollment", () => ({
  createBoxOfficeClassCash: (...args: unknown[]) => cashMock(...args),
  createBoxOfficeClassCheckout: (...args: unknown[]) => checkoutMock(...args),
}));

vi.mock("@/features/on-coming-events/lib/buildScheduleMonthGrid", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/on-coming-events/lib/buildScheduleMonthGrid")
  >("@/features/on-coming-events/lib/buildScheduleMonthGrid");
  return { ...actual, getNextOccurrence: () => "2030-03-15" };
});

import { useBoxOfficeClassesForm } from "./useBoxOfficeClassesForm";

function makeFormEvent(): React.FormEvent {
  return { preventDefault: vi.fn() } as unknown as React.FormEvent;
}

describe("useBoxOfficeClassesForm", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
    fetchEventsMock.mockClear();
    fetchEventsMock.mockResolvedValue({
      ok: true,
      events: [makeBoxOfficeClassEventOption()],
    });
    fetchContextMock.mockClear();
    fetchContextMock.mockResolvedValue({
      ok: true,
      context: makeBoxOfficeClassContext(),
    });
    cashMock.mockClear();
    cashMock.mockResolvedValue({
      ok: true,
      enrollmentId: "enr_1",
      message: "Class reserved.",
    });
    checkoutMock.mockClear();
  });

  it("loads bookable class events on mount", async () => {
    const { result } = renderHook(() => useBoxOfficeClassesForm());
    await waitFor(() => expect(result.current.eventsLoading).toBe(false));
    expect(result.current.events).toEqual([makeBoxOfficeClassEventOption()]);
    expect(result.current.eventsError).toBeNull();
  });

  it("sets a form error when submitting without selecting an event", async () => {
    const { result } = renderHook(() => useBoxOfficeClassesForm());
    await waitFor(() => expect(result.current.eventsLoading).toBe(false));

    await act(async () => {
      await result.current.onSubmit(makeFormEvent());
    });

    expect(result.current.formError).toBe("Select a class event.");
    expect(cashMock).not.toHaveBeenCalled();
    expect(checkoutMock).not.toHaveBeenCalled();
  });

  it("books a single session with cash after filling the form", async () => {
    const { result } = renderHook(() => useBoxOfficeClassesForm());
    await waitFor(() => expect(result.current.eventsLoading).toBe(false));

    act(() => {
      result.current.onSelectEvent(FIXTURE_CLASS_EVENT_ID);
    });
    await waitFor(() => expect(result.current.contextLoading).toBe(false));
    await waitFor(() => expect(result.current.context).not.toBeNull());
    expect(result.current.contextBookable).toBe(true);

    act(() => {
      result.current.setCustomerName("Jane Doe");
      result.current.setCustomerEmail("jane@example.com");
      result.current.onSelectWeekday(5);
    });
    await waitFor(() =>
      expect(result.current.sectionOffers.length).toBeGreaterThan(0),
    );

    act(() => {
      result.current.toggleSessionId(FIXTURE_SESSION_ID);
      result.current.setCashConfirmed(true);
    });
    expect(result.current.paymentMethod).toBe("cash");

    await act(async () => {
      await result.current.onSubmit(makeFormEvent());
    });

    expect(cashMock).toHaveBeenCalledWith(
      "token-1",
      expect.objectContaining({
        purchaseKind: "session",
        upcomingEventId: FIXTURE_CLASS_EVENT_ID,
        sessionId: FIXTURE_SESSION_ID,
        customerName: "Jane Doe",
        customerEmail: "jane@example.com",
      }),
    );
    expect(checkoutMock).not.toHaveBeenCalled();
    expect(result.current.formError).toBeNull();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Class reserved" }),
    );
  });
});
