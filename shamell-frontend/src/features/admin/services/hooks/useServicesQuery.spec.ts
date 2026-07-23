/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { FIXTURE_SERVICE_ID } from "../test/fixtures/uuids.fixture";

const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/lib/admin/auth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

import { useServicesQuery } from "./useServicesQuery";

describe("useServicesQuery", () => {
  beforeEach(() => {
    getTokenMock.mockReturnValue("token-1");
  });

  it("loads services from MSW when authenticated", async () => {
    const { result } = renderHook(() => useServicesQuery());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.services.length).toBeGreaterThan(0);
    expect(result.current.services[0]?.id).toBe(FIXTURE_SERVICE_ID);
  });

  it("keeps services empty when token is null", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => useServicesQuery());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.services).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("does not load when enabled is false", async () => {
    const { result } = renderHook(() => useServicesQuery(false));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.services).toEqual([]);
  });
});
