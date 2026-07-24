/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { FIXTURE_CHAIR_ID } from "../test/fixtures/uuids.fixture";

const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

import { useStandaloneChairsConfig } from "./useStandaloneChairsConfig";

describe("useStandaloneChairsConfig", () => {
  beforeEach(() => {
    getTokenMock.mockReturnValue("token-1");
  });

  it("loads chairs via MSW", async () => {
    const { result } = renderHook(() => useStandaloneChairsConfig());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.chairs[0]?.id).toBe(FIXTURE_CHAIR_ID);
    expect(result.current.unitPrice).toBe(35);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.reservedCount).toBe(1);
  });

  it("skips fetch when there is no token", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => useStandaloneChairsConfig());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.chairs).toEqual([]);
  });
});
