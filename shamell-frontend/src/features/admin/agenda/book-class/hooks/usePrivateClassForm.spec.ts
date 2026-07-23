/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");
const validateMock = vi.fn(() => null as string | null);
const buildBodyMock = vi.fn(() => ({
  classType: "Private belly dance",
  eventDate: "2026-08-15",
  eventTimeStart: "10:00",
  location: "Studio",
  customerName: "Ada",
  customerEmail: "ada@example.com",
  amountUsd: 120,
}));
const cashMock = vi.fn(async () => ({
  ok: true as const,
  bookingId: "b1",
  message: "Reserved",
}));
const checkoutMock = vi.fn(async () => ({
  ok: true as const,
  bookingId: "b2",
  quoteId: "q1",
  message: "Link sent",
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

vi.mock("../lib/privateClassValidation", () => ({
  validatePrivateClassForm: (...args: unknown[]) => validateMock(...args),
  buildPrivateClassRequestBody: (...args: unknown[]) => buildBodyMock(...args),
}));

vi.mock("../services/createPrivateClassBooking", () => ({
  createPrivateClassCash: (...args: unknown[]) => cashMock(...args),
  createPrivateClassCheckoutSession: (...args: unknown[]) => checkoutMock(...args),
}));

import { usePrivateClassForm } from "./usePrivateClassForm";

function makeEvent(): React.FormEvent {
  return { preventDefault: vi.fn() } as unknown as React.FormEvent;
}

describe("usePrivateClassForm", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
    validateMock.mockReturnValue(null);
    buildBodyMock.mockReturnValue({
      classType: "Private belly dance",
      eventDate: "2026-08-15",
      eventTimeStart: "10:00",
      location: "Studio",
      customerName: "Ada",
      customerEmail: "ada@example.com",
      amountUsd: 120,
    });
    cashMock.mockClear();
    checkoutMock.mockClear();
    cashMock.mockResolvedValue({ ok: true, bookingId: "b1", message: "Reserved" });
    checkoutMock.mockResolvedValue({
      ok: true,
      bookingId: "b2",
      quoteId: "q1",
      message: "Link sent",
    });
  });

  it("toasts and skips submit when validation fails", async () => {
    validateMock.mockReturnValue("Class type is required.");
    const { result } = renderHook(() => usePrivateClassForm());
    await act(async () => {
      await result.current.onSubmit(makeEvent());
    });
    expect(cashMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Missing fields", variant: "destructive" }),
    );
  });

  it("toasts when there is no admin token", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => usePrivateClassForm());
    await act(async () => {
      await result.current.onSubmit(makeEvent());
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Sign-in required" }),
    );
  });

  it("creates a Stripe checkout session by default and resets", async () => {
    const { result } = renderHook(() => usePrivateClassForm());
    act(() => {
      result.current.patch({ classType: "Private belly dance" });
    });
    await act(async () => {
      await result.current.onSubmit(makeEvent());
    });
    expect(checkoutMock).toHaveBeenCalledOnce();
    expect(cashMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Payment link sent" }),
    );
    expect(result.current.fields.classType).toBe("");
  });

  it("creates a cash booking when payment method is cash", async () => {
    const { result } = renderHook(() => usePrivateClassForm());
    act(() => {
      result.current.setPaymentMethod("cash");
      result.current.patch({ cashConfirmed: true });
    });
    await act(async () => {
      await result.current.onSubmit(makeEvent());
    });
    expect(cashMock).toHaveBeenCalledOnce();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Private class reserved" }),
    );
  });

  it("clears cashConfirmed when switching away from cash", () => {
    const { result } = renderHook(() => usePrivateClassForm());
    act(() => {
      result.current.setPaymentMethod("cash");
      result.current.patch({ cashConfirmed: true });
    });
    expect(result.current.fields.cashConfirmed).toBe(true);
    act(() => {
      result.current.setPaymentMethod("stripe");
    });
    expect(result.current.fields.paymentMethod).toBe("stripe");
    expect(result.current.fields.cashConfirmed).toBe(false);
  });

  it("toasts when the API returns not ok", async () => {
    checkoutMock.mockResolvedValueOnce({ ok: false, message: "No service" });
    const { result } = renderHook(() => usePrivateClassForm());
    await act(async () => {
      await result.current.onSubmit(makeEvent());
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Could not save", description: "No service" }),
    );
  });
});
