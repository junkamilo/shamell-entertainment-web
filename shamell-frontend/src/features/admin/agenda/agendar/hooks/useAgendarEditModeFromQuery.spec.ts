/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { FIXTURE_BOOKING_ID } from "../tests/fixtures/uuids.fixture";

let params = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => params.get(key),
    toString: () => params.toString(),
  }),
}));

import { useAgendarEditModeFromQuery } from "./useAgendarEditModeFromQuery";

describe("useAgendarEditModeFromQuery", () => {
  beforeEach(() => {
    params = new URLSearchParams();
  });

  it("is false without a bookingId", () => {
    const { result } = renderHook(() => useAgendarEditModeFromQuery());
    expect(result.current).toBe(false);
  });

  it("is false for a non-uuid bookingId", () => {
    params.set("bookingId", "not-a-uuid");
    const { result } = renderHook(() => useAgendarEditModeFromQuery());
    expect(result.current).toBe(false);
  });

  it("is true for a valid booking uuid", () => {
    params.set("bookingId", FIXTURE_BOOKING_ID);
    const { result } = renderHook(() => useAgendarEditModeFromQuery());
    expect(result.current).toBe(true);
  });
});
