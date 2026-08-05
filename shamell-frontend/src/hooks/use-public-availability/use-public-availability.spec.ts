/** @vitest-environment jsdom */

import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { server } from "@/test/server";
import { publicAvailabilityHandler } from "../test/mocks/handlers";
import {
  clearPublicAvailabilityCache,
  usePublicAvailability,
} from "./use-public-availability";

describe("usePublicAvailability", () => {
  beforeEach(() => {
    clearPublicAvailabilityCache();
    server.use(publicAvailabilityHandler());
  });

  it("loads public availability rules", async () => {
    const { result } = renderHook(() => usePublicAvailability(true, { polling: false }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.rules?.timeZone).toBe("America/New_York");
    expect(result.current.rules?.weekly).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it("reuses the in-memory cache on remount without a second network hit", async () => {
    let hits = 0;
    server.use(
      http.get("*/api/v1/availability/public", () => {
        hits += 1;
        return HttpResponse.json({
          timeZone: "America/New_York",
          weekly: [{ weekday: 1, startMinutes: 600, endMinutes: 1080 }],
          closures: [],
        });
      }),
    );

    const first = renderHook(() => usePublicAvailability(true, { polling: false }));
    await waitFor(() => expect(first.result.current.isLoading).toBe(false));
    expect(hits).toBe(1);
    first.unmount();

    const second = renderHook(() => usePublicAvailability(true, { polling: false }));
    await waitFor(() => expect(second.result.current.isLoading).toBe(false));
    expect(hits).toBe(1);
    expect(second.result.current.rules?.timeZone).toBe("America/New_York");
  });

  it("force reload bypasses the cache", async () => {
    let hits = 0;
    server.use(
      http.get("*/api/v1/availability/public", () => {
        hits += 1;
        return HttpResponse.json({
          timeZone: "America/New_York",
          weekly: [],
          closures: [],
        });
      }),
    );

    const { result } = renderHook(() => usePublicAvailability(true, { polling: false }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(hits).toBe(1);

    await act(async () => {
      result.current.reload({ force: true });
    });
    await waitFor(() => expect(hits).toBe(2));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("does not fetch when disabled", async () => {
    const { result } = renderHook(() =>
      usePublicAvailability(false, { polling: false }),
    );
    expect(result.current.rules).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("surfaces API errors", async () => {
    server.use(
      http.get("*/api/v1/availability/public", () =>
        HttpResponse.json({ message: "Unavailable" }, { status: 503 }),
      ),
    );
    const { result } = renderHook(() =>
      usePublicAvailability(true, { polling: false }),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("Unavailable");
    expect(result.current.rules).toBeNull();
  });
});
