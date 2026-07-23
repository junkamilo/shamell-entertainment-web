/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { FIXTURE_OCCASION_ID } from "../test/fixtures/uuids.fixture";

const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("../lib/eventTypesAuth", () => ({
  getEventTypesBearerToken: () => getTokenMock(),
}));

import { useEventTypesOccasionCatalog } from "./useEventTypesOccasionCatalog";

describe("useEventTypesOccasionCatalog", () => {
  beforeEach(() => {
    getTokenMock.mockReturnValue("token-1");
  });

  it("loads occasions via MSW when isModalOpen is true", async () => {
    const { result } = renderHook(() => useEventTypesOccasionCatalog(true));

    await waitFor(() => expect(result.current.occasionCatalog.length).toBeGreaterThan(0));
    expect(result.current.occasionCatalog[0]?.id).toBe(FIXTURE_OCCASION_ID);
  });

  it("stays empty when isModalOpen is false", async () => {
    const { result } = renderHook(() => useEventTypesOccasionCatalog(false));

    await waitFor(() => expect(result.current.occasionCatalog).toEqual([]));
    expect(result.current.occasionCatalog).toEqual([]);
  });

  it("stays empty when modal is open but there is no token", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => useEventTypesOccasionCatalog(true));

    await waitFor(() => expect(result.current.occasionCatalog).toEqual([]));
  });
});
