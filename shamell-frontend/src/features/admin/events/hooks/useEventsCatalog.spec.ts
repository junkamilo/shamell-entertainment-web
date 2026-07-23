/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { FIXTURE_EVENT_ID, FIXTURE_EVENT_TYPE_ID } from "../test/fixtures/uuids.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("../lib/eventsAuth", () => ({
  getEventsBearerToken: () => getTokenMock(),
}));

import { useEventsCatalog } from "./useEventsCatalog";

describe("useEventsCatalog", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
  });

  it("loads events and types via MSW and calls onSeedEventTypes", async () => {
    const onSeedEventTypes = vi.fn();
    const { result } = renderHook(() => useEventsCatalog(onSeedEventTypes));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.events.length).toBeGreaterThan(0);
    expect(result.current.events[0]?.id).toBe(FIXTURE_EVENT_ID);
    expect(result.current.eventTypes.length).toBeGreaterThan(0);
    expect(result.current.eventTypes[0]?.id).toBe(FIXTURE_EVENT_TYPE_ID);
    expect(onSeedEventTypes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: FIXTURE_EVENT_TYPE_ID }),
      ]),
    );
  });

  it("toasts sign-in required when there is no token", async () => {
    getTokenMock.mockReturnValue(null);
    const onSeedEventTypes = vi.fn();
    const { result } = renderHook(() => useEventsCatalog(onSeedEventTypes));

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          title: "Sign-in required",
        }),
      ),
    );
    expect(result.current.events).toEqual([]);
    expect(result.current.eventTypes).toEqual([]);
    expect(onSeedEventTypes).not.toHaveBeenCalled();
  });
});
