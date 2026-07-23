/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { FIXTURE_SERVICE_ID, FIXTURE_SERVICE_TYPE_ID } from "../test/fixtures/uuids.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("../lib/servicesAuth", () => ({
  getServicesBearerToken: () => getTokenMock(),
}));

import { useServicesCatalog } from "./useServicesCatalog";

describe("useServicesCatalog", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
  });

  it("loads services and types and calls onSeedServiceTypes", async () => {
    const onSeedServiceTypes = vi.fn();
    const { result } = renderHook(() => useServicesCatalog(onSeedServiceTypes));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.services.length).toBeGreaterThan(0);
    expect(result.current.services[0]?.id).toBe(FIXTURE_SERVICE_ID);
    expect(result.current.serviceTypes.length).toBeGreaterThan(0);
    expect(result.current.serviceTypes[0]?.id).toBe(FIXTURE_SERVICE_TYPE_ID);
    expect(onSeedServiceTypes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: FIXTURE_SERVICE_TYPE_ID }),
      ]),
    );
  });

  it("toasts sign-in required when there is no token", async () => {
    getTokenMock.mockReturnValue(null);
    const onSeedServiceTypes = vi.fn();
    const { result } = renderHook(() => useServicesCatalog(onSeedServiceTypes));

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          title: "Sign-in required",
        }),
      ),
    );
    expect(result.current.services).toEqual([]);
    expect(result.current.serviceTypes).toEqual([]);
    expect(onSeedServiceTypes).not.toHaveBeenCalled();
  });
});
