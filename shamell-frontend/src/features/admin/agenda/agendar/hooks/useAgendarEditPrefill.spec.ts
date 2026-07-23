/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { createMockAgendarFormState } from "../tests/helpers/mockAgendarFormState";
import { mockSearchParams } from "../tests/helpers/mockSearchParams";
import { makeAdminBookingRow } from "../tests/fixtures/bookingRow.fixture";
import { FIXTURE_BOOKING_ID } from "../tests/fixtures/uuids.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");
const fetchBookingMock = vi.fn(async () => makeAdminBookingRow());
const applyRowMock = vi.fn();
const applyQueryMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

vi.mock("@/features/admin/agenda/peticiones/lib/peticionesDateUtils", () => ({
  bookingTimeZone: () => "America/New_York",
}));

vi.mock("../services/fetchAgendarBookingForEdit", () => ({
  fetchAgendarBookingForEdit: (...args: unknown[]) => fetchBookingMock(...args),
}));

vi.mock("../lib/mapBookingRowToAgendarForm", () => ({
  applyBookingRowToAgendarForm: (...args: unknown[]) => applyRowMock(...args),
}));

vi.mock("../lib/applyAgendarQueryPrefill", () => ({
  applyAgendarQueryPrefill: (...args: unknown[]) => applyQueryMock(...args),
}));

import { useAgendarEditPrefill } from "./useAgendarEditPrefill";

describe("useAgendarEditPrefill", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
    fetchBookingMock.mockReset();
    fetchBookingMock.mockResolvedValue(makeAdminBookingRow());
    applyRowMock.mockClear();
    applyQueryMock.mockClear();
  });

  it("does not load when not in edit mode", async () => {
    const form = createMockAgendarFormState();
    const params = mockSearchParams({}) as unknown as ReadonlyURLSearchParams;
    const { result } = renderHook(() =>
      useAgendarEditPrefill("", false, params, form, "America/New_York"),
    );

    await waitFor(() => expect(result.current.editLoading).toBe(false));
    expect(fetchBookingMock).not.toHaveBeenCalled();
  });

  it("loads booking and applies form + query prefill", async () => {
    const form = createMockAgendarFormState();
    const params = mockSearchParams({}) as unknown as ReadonlyURLSearchParams;
    const row = makeAdminBookingRow();
    fetchBookingMock.mockResolvedValueOnce(row);

    const { result } = renderHook(() =>
      useAgendarEditPrefill(FIXTURE_BOOKING_ID, true, params, form, "America/New_York"),
    );

    await waitFor(() => expect(result.current.editLoading).toBe(false));
    expect(fetchBookingMock).toHaveBeenCalledWith("token-1", FIXTURE_BOOKING_ID);
    expect(applyRowMock).toHaveBeenCalledWith(row, form, "America/New_York");
    expect(applyQueryMock).toHaveBeenCalledWith(params, form);
  });

  it("toasts when edit fetch fails", async () => {
    fetchBookingMock.mockRejectedValueOnce(new Error("nope"));
    const form = createMockAgendarFormState();
    const params = mockSearchParams({}) as unknown as ReadonlyURLSearchParams;

    const { result } = renderHook(() =>
      useAgendarEditPrefill(FIXTURE_BOOKING_ID, true, params, form),
    );

    await waitFor(() => expect(toastMock).toHaveBeenCalled());
    expect(result.current.editLoading).toBe(false);
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Could not load booking for edit",
        variant: "destructive",
      }),
    );
  });

  it("skips fetch without a token", async () => {
    getTokenMock.mockReturnValue(null);
    const form = createMockAgendarFormState();
    const params = mockSearchParams({}) as unknown as ReadonlyURLSearchParams;

    const { result } = renderHook(() =>
      useAgendarEditPrefill(FIXTURE_BOOKING_ID, true, params, form),
    );

    await waitFor(() => expect(result.current.editLoading).toBe(false));
    expect(fetchBookingMock).not.toHaveBeenCalled();
  });
});
