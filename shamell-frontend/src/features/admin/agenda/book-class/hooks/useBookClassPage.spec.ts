/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  makeBookClassEventContext,
  makeBookClassEventOption,
  makeMonthPackageOffer,
} from "../test/fixtures/bookClass.fixture";
import {
  FIXTURE_CLASS_EVENT_ID,
  FIXTURE_SESSION_ID,
  FIXTURE_SESSION_ID_2,
} from "../test/fixtures/uuids.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");
const cashEnrollmentMock = vi.fn(async () => ({
  ok: true as const,
  enrollmentId: "enr_1",
  message: "Cash ok",
}));
const checkoutMock = vi.fn(async () => ({
  ok: true as const,
  enrollmentId: "enr_2",
  message: "Checkout ok",
  payUrl: "https://pay.test",
}));

const context = makeBookClassEventContext();
const catalogMock = {
  events: [makeBookClassEventOption()],
  eventsLoading: false,
  hasBookableEvents: true,
  context,
  contextLoading: false,
  error: null as string | null,
  reloadContext: vi.fn(),
};

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

vi.mock("../services/createAdminClassEnrollment", () => ({
  createAdminClassCashEnrollment: (...args: unknown[]) => cashEnrollmentMock(...args),
  createAdminClassCheckoutSession: (...args: unknown[]) => checkoutMock(...args),
}));

vi.mock("./useBookClassCatalog", () => ({
  useBookClassCatalog: () => catalogMock,
}));

vi.mock("@/features/on-coming-events/lib/buildScheduleMonthGrid", () => ({
  getNextOccurrence: () => "2030-03-15",
}));

vi.mock("@/features/on-coming-events/lib/buildMonthPackagePreview", () => ({
  isMonthPackagePurchasable: () => true,
  buildMonthPackagePreview: () => ({
    monthLabel: "March 2030",
    sessionCount: 4,
  }),
}));

import { useBookClassPage } from "./useBookClassPage";

function makeEvent(): React.FormEvent {
  return { preventDefault: vi.fn() } as unknown as React.FormEvent;
}

async function fillValidDayBooking(
  result: { current: ReturnType<typeof useBookClassPage> },
) {
  await act(async () => {
    result.current.form.setEventId(FIXTURE_CLASS_EVENT_ID);
    result.current.form.setCustomerName("Jane Doe");
    result.current.form.setCustomerEmail("jane@example.com");
    result.current.onSelectWeekday(5);
    result.current.form.toggleSessionId(FIXTURE_SESSION_ID);
  });
}

describe("useBookClassPage", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
    cashEnrollmentMock.mockClear();
    checkoutMock.mockClear();
    cashEnrollmentMock.mockResolvedValue({
      ok: true,
      enrollmentId: "enr_1",
      message: "Cash ok",
    });
    checkoutMock.mockResolvedValue({
      ok: true,
      enrollmentId: "enr_2",
      message: "Checkout ok",
      payUrl: "https://pay.test",
    });
    catalogMock.context = context;
    catalogMock.error = null;
    catalogMock.contextLoading = false;
  });

  it("exposes recurring days and month package from context", () => {
    const { result } = renderHook(() => useBookClassPage());
    expect(result.current.days.map((d) => d.weekday)).toEqual([5]);
    expect(result.current.hasMonthPackage).toBe(true);
    expect(result.current.contextBookable).toBe(true);
    expect(result.current.monthPackage).toEqual(makeMonthPackageOffer());
  });

  it("selects weekday and next occurrence date", () => {
    const { result } = renderHook(() => useBookClassPage());

    act(() => {
      result.current.onSelectWeekday(5);
    });

    expect(result.current.form.weekday).toBe(5);
    expect(result.current.form.selectedDateIso).toBe("2030-03-15");
    expect(result.current.form.selectedSessionIds.size).toBe(0);
  });

  it("toasts validation errors without calling enrollment APIs", async () => {
    const { result } = renderHook(() => useBookClassPage());

    await act(async () => {
      await result.current.onSubmit(makeEvent());
    });

    expect(checkoutMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Check the form", variant: "destructive" }),
    );
  });

  it("creates a Stripe checkout session for a single section", async () => {
    const { result } = renderHook(() => useBookClassPage());
    await fillValidDayBooking(result);

    await act(async () => {
      await result.current.onSubmit(makeEvent());
    });

    expect(checkoutMock).toHaveBeenCalledWith(
      "token-1",
      expect.objectContaining({
        purchaseKind: "session",
        upcomingEventId: FIXTURE_CLASS_EVENT_ID,
        sessionId: FIXTURE_SESSION_ID,
        customerEmail: "jane@example.com",
      }),
    );
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Payment link sent" }),
    );
    expect(result.current.form.customerName).toBe("");
  });

  it("posts a day_bundle when multiple sections are selected", async () => {
    const { result } = renderHook(() => useBookClassPage());
    await fillValidDayBooking(result);

    await act(async () => {
      result.current.form.toggleSessionId(FIXTURE_SESSION_ID_2);
    });

    await act(async () => {
      await result.current.onSubmit(makeEvent());
    });

    expect(checkoutMock).toHaveBeenCalledWith(
      "token-1",
      expect.objectContaining({
        purchaseKind: "day_bundle",
        sessionIds: expect.arrayContaining([FIXTURE_SESSION_ID, FIXTURE_SESSION_ID_2]),
      }),
    );
  });

  it("reserves with cash when confirmed", async () => {
    const { result } = renderHook(() => useBookClassPage());
    await fillValidDayBooking(result);

    await act(async () => {
      result.current.form.setPaymentMethod("cash");
      result.current.form.setCashConfirmed(true);
    });

    await act(async () => {
      await result.current.onSubmit(makeEvent());
    });

    expect(cashEnrollmentMock).toHaveBeenCalledOnce();
    expect(checkoutMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Class reserved" }),
    );
  });

  it("blocks submit when the class context is not bookable", async () => {
    catalogMock.context = makeBookClassEventContext({
      readiness: { isBookable: false, reasons: ["no_sessions"] },
    });
    const { result } = renderHook(() => useBookClassPage());

    await act(async () => {
      result.current.form.setEventId(FIXTURE_CLASS_EVENT_ID);
      result.current.form.setCustomerName("Jane");
      result.current.form.setCustomerEmail("jane@example.com");
      await result.current.onSubmit(makeEvent());
    });

    expect(checkoutMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Class event not ready", variant: "destructive" }),
    );
  });

  it("toasts enrollment API failures", async () => {
    checkoutMock.mockResolvedValueOnce({ ok: false, message: "Sold out" });
    const { result } = renderHook(() => useBookClassPage());
    await fillValidDayBooking(result);

    await act(async () => {
      await result.current.onSubmit(makeEvent());
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Could not book class",
        description: "Sold out",
        variant: "destructive",
      }),
    );
  });

  it("syncs monthIso when a month package is available", async () => {
    const { result } = renderHook(() => useBookClassPage());
    await waitFor(() =>
      expect(result.current.form.monthIso).toBe(makeMonthPackageOffer().currentMonthIso),
    );
  });
});
