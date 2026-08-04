/** @vitest-environment jsdom */

import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/admin/session";
import { server } from "@/test/server";
import { bookingsAdminListHandler } from "./test/mocks/handlers";
import { makeAdminBookingsPayload } from "./test/fixtures/hooks.fixture";
import {
  FIXTURE_BOOKING_ID,
  FIXTURE_SERVICE_ID,
} from "./test/fixtures/uuids.fixture";
import { useAdminBookings } from "./use-admin-bookings";

describe("useAdminBookings", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, "token-1");
    server.use(bookingsAdminListHandler());
  });

  it("loads bookings when enabled and token is present", async () => {
    const { result } = renderHook(() => useAdminBookings(true));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.bookings[0]?.id).toBe(FIXTURE_BOOKING_ID);
    expect(result.current.error).toBeNull();
  });

  it("clears bookings when token is missing", async () => {
    localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
    const { result } = renderHook(() => useAdminBookings(true));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.bookings).toEqual([]);
  });

  it("does not fetch when disabled", async () => {
    const { result } = renderHook(() => useAdminBookings(false));
    await waitFor(() => expect(result.current.isLoading).toBe(true));
    expect(result.current.bookings).toEqual([]);
  });

  it("creates, patches, quotes, and deletes bookings", async () => {
    const { result } = renderHook(() => useAdminBookings(true));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      const created = await result.current.createBooking({
        serviceId: FIXTURE_SERVICE_ID,
        eventDate: "2026-08-01T14:00:00.000Z",
        location: "Ballroom",
      });
      expect(created).toMatchObject({ location: "Ballroom" });
    });

    await act(async () => {
      const patched = await result.current.patchBooking(FIXTURE_BOOKING_ID, {
        status: "CANCELLED",
      });
      expect(patched).toMatchObject({ status: "CANCELLED" });
    });

    await act(async () => {
      const quote = await result.current.createBookingQuote(FIXTURE_BOOKING_ID, {
        paymentModel: "FULL",
        totalAmount: 1000,
      });
      expect(quote).toMatchObject({ ok: true });
    });

    await act(async () => {
      const balance = await result.current.sendBalanceLink(FIXTURE_BOOKING_ID);
      expect(balance).toMatchObject({ ok: true });
    });

    await act(async () => {
      await result.current.removeBooking(FIXTURE_BOOKING_ID);
    });
  });

  it("surfaces list errors", async () => {
    server.use(
      http.get("*/api/v1/bookings/admin", () =>
        HttpResponse.json({ message: "Denied" }, { status: 403 }),
      ),
    );
    const { result } = renderHook(() => useAdminBookings(true));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toMatch(/Denied|bookings/i);
  });

  it("accepts a legacy array list payload", async () => {
    server.use(
      bookingsAdminListHandler(
        makeAdminBookingsPayload().items as never,
      ),
    );
    // Override with raw array response
    server.use(
      http.get("*/api/v1/bookings/admin", () =>
        HttpResponse.json(makeAdminBookingsPayload().items),
      ),
    );
    const { result } = renderHook(() => useAdminBookings(true));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.bookings).toHaveLength(1);
    expect(result.current.meta.totalPages).toBe(1);
  });
});
