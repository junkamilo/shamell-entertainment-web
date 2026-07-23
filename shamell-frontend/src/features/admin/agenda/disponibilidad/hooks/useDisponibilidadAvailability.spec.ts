/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";

const getDisponibilidadBearerTokenMock = vi.fn((): string | null => null);

vi.mock("../lib/disponibilidadAuth", () => ({
  getDisponibilidadBearerToken: () => getDisponibilidadBearerTokenMock(),
  getDisponibilidadAuthHeaders: () => ({ "Content-Type": "application/json" }),
}));

import { useDisponibilidadAvailability } from "./useDisponibilidadAvailability";
import {
  makeAdminAvailabilitySnapshot,
  makeCreateClosurePayload,
} from "../test/fixtures/disponibilidad.fixture";
import { FIXTURE_CLOSURE_SPECIFIC_ID } from "../test/fixtures/uuids.fixture";
import { defaultWeekly } from "../lib/disponibilidadConstants";

describe("useDisponibilidadAvailability", () => {
  beforeEach(() => {
    getDisponibilidadBearerTokenMock.mockReset();
    getDisponibilidadBearerTokenMock.mockReturnValue(null);
  });

  it("keeps the snapshot null and loading false when there is no token", async () => {
    const { result } = renderHook(() => useDisponibilidadAvailability());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.snapshot).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("loads the snapshot when a token is present", async () => {
    getDisponibilidadBearerTokenMock.mockReturnValue("token-1");
    const { result } = renderHook(() => useDisponibilidadAvailability());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.snapshot).toEqual(makeAdminAvailabilitySnapshot());
    expect(result.current.error).toBeNull();
  });

  it("does not fetch when disabled", async () => {
    getDisponibilidadBearerTokenMock.mockReturnValue("token-1");
    const { result } = renderHook(() => useDisponibilidadAvailability(false));

    await waitFor(() => expect(result.current.isLoading).toBe(true));
    expect(result.current.snapshot).toBeNull();
  });

  it("sets an error message when loading fails", async () => {
    getDisponibilidadBearerTokenMock.mockReturnValue("token-1");
    server.use(
      http.get("*/api/v1/availability/admin", () =>
        HttpResponse.json({ message: "Boom" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useDisponibilidadAvailability());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.snapshot).toBeNull();
    expect(result.current.error).toBe("Boom");
  });

  it("putWeekly saves and updates the snapshot", async () => {
    getDisponibilidadBearerTokenMock.mockReturnValue("token-1");
    const { result } = renderHook(() => useDisponibilidadAvailability());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.putWeekly(defaultWeekly());
    });

    expect(result.current.snapshot).toEqual(makeAdminAvailabilitySnapshot());
  });

  it("putWeekly throws 'Not signed in.' when there is no token", async () => {
    getDisponibilidadBearerTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => useDisponibilidadAvailability());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(
      act(async () => {
        await result.current.putWeekly(defaultWeekly());
      }),
    ).rejects.toThrow("Not signed in.");
  });

  it("createClosure posts the closure and reloads the snapshot", async () => {
    getDisponibilidadBearerTokenMock.mockReturnValue("token-1");
    const { result } = renderHook(() => useDisponibilidadAvailability());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createClosure(makeCreateClosurePayload());
    });

    expect(result.current.snapshot).toEqual(makeAdminAvailabilitySnapshot());
  });

  it("removeClosure deletes the closure and reloads the snapshot", async () => {
    getDisponibilidadBearerTokenMock.mockReturnValue("token-1");
    const { result } = renderHook(() => useDisponibilidadAvailability());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.removeClosure(FIXTURE_CLOSURE_SPECIFIC_ID);
    });

    expect(result.current.snapshot).toEqual(makeAdminAvailabilitySnapshot());
  });

  it("reload re-fetches the snapshot on demand", async () => {
    getDisponibilidadBearerTokenMock.mockReturnValue("token-1");
    const { result } = renderHook(() => useDisponibilidadAvailability());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.reload();
    });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.snapshot).toEqual(makeAdminAvailabilitySnapshot());
  });
});
