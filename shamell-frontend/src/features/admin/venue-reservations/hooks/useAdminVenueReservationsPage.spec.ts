/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { makeVenueReservationsApiPayload } from "../test/fixtures/venueReservations.fixture";
import {
  FIXTURE_LAYOUT_ITEM_ID,
  FIXTURE_RESERVATION_ID,
} from "../test/fixtures/uuids.fixture";
import { venueReservationsListHandler } from "../test/mocks/handlers";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");
const searchParamsGetMock = vi.fn((_key: string) => null as string | null);

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => searchParamsGetMock(key),
  }),
}));

import { useAdminVenueReservationsPage } from "./useAdminVenueReservationsPage";

describe("useAdminVenueReservationsPage", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
    searchParamsGetMock.mockReturnValue(null);
    server.use(venueReservationsListHandler());
  });

  it("loads reservations after mount", async () => {
    const { result } = renderHook(() => useAdminVenueReservationsPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.reservations.length).toBeGreaterThan(0);
    expect(result.current.reservations[0]?.id).toBe(FIXTURE_RESERVATION_ID);
  });

  it("applies status and layoutItemId from search params", async () => {
    searchParamsGetMock.mockImplementation((key: string) => {
      if (key === "status") return "PAID";
      if (key === "layoutItemId") return FIXTURE_LAYOUT_ITEM_ID;
      return null;
    });

    const { result } = renderHook(() => useAdminVenueReservationsPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.statusFilter).toBe("PAID");
    expect(result.current.layoutItemIdFilter).toBe(FIXTURE_LAYOUT_ITEM_ID);
  });

  it("toasts on load failure", async () => {
    server.use(
      http.get("*/api/v1/venue-reservations/admin", () =>
        HttpResponse.json({ message: "down" }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useAdminVenueReservationsPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Load failed" }),
    );
  });

  it("cancels a reservation and reloads", async () => {
    let list = makeVenueReservationsApiPayload();
    server.use(
      http.get("*/api/v1/venue-reservations/admin", () =>
        HttpResponse.json(list),
      ),
      http.patch("*/api/v1/venue-reservations/admin/:id/cancel", ({ params }) => {
        list = {
          ...list,
          reservations: list.reservations.filter(
            (r) => r.id !== String(params.id),
          ),
          meta: { ...list.meta, totalItems: list.reservations.length - 1 },
        };
        return HttpResponse.json({ ok: true, message: "Reservation cancelled." });
      }),
    );

    const { result } = renderHook(() => useAdminVenueReservationsPage());
    await waitFor(() => expect(result.current.reservations.length).toBe(2));

    await act(async () => {
      await result.current.cancelReservation(FIXTURE_RESERVATION_ID);
    });

    await waitFor(() => {
      expect(
        result.current.reservations.find((r) => r.id === FIXTURE_RESERVATION_ID),
      ).toBeUndefined();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Reservation cancelled" }),
    );
  });

  it("skips load when there is no token", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => useAdminVenueReservationsPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.reservations).toEqual([]);
  });

  it("resets page when filters change via onPerPageChange", async () => {
    const { result } = renderHook(() => useAdminVenueReservationsPage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.onPageChange(2);
    });
    act(() => {
      result.current.onPerPageChange(25);
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});
