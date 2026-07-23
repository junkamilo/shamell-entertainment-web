/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { AGENDAR_PATH } from "../../lib/agendaRoutes";

const replace = vi.fn();
let params = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({
    get: (key: string) => params.get(key),
    toString: () => params.toString(),
  }),
}));

import { useAgendarBookMode } from "./useAgendarBookMode";

describe("useAgendarBookMode", () => {
  beforeEach(() => {
    replace.mockClear();
    params = new URLSearchParams();
  });

  it("defaults to event and shows the class tab when not editing", () => {
    const { result } = renderHook(() => useAgendarBookMode(false));
    expect(result.current.bookMode).toBe("event");
    expect(result.current.showClassTab).toBe(true);
  });

  it("reads mode=class from the query", () => {
    params.set("mode", "class");
    const { result } = renderHook(() => useAgendarBookMode(false));
    expect(result.current.bookMode).toBe("class");
  });

  it("forces event and hides class tab in edit mode", () => {
    params.set("mode", "class");
    const { result } = renderHook(() => useAgendarBookMode(true));
    expect(result.current.bookMode).toBe("event");
    expect(result.current.showClassTab).toBe(false);
  });

  it("navigates to mode=class", () => {
    const { result } = renderHook(() => useAgendarBookMode(false));
    act(() => {
      result.current.setBookMode("class");
    });
    expect(replace).toHaveBeenCalledWith(`${AGENDAR_PATH}?mode=class`, { scroll: false });
  });

  it("clears mode when switching back to event", () => {
    params.set("mode", "class");
    const { result } = renderHook(() => useAgendarBookMode(false));
    act(() => {
      result.current.setBookMode("event");
    });
    expect(replace).toHaveBeenCalledWith(AGENDAR_PATH, { scroll: false });
  });

  it("strips classKind when switching to private-class mode", () => {
    params.set("classKind", "group");
    const { result } = renderHook(() => useAgendarBookMode(false));
    act(() => {
      result.current.setBookMode("class");
    });
    expect(replace).toHaveBeenCalledWith(`${AGENDAR_PATH}?mode=class`, { scroll: false });
  });

  it("strips classKind when switching back to event", () => {
    params.set("mode", "class");
    params.set("classKind", "group");
    const { result } = renderHook(() => useAgendarBookMode(false));
    act(() => {
      result.current.setBookMode("event");
    });
    expect(replace).toHaveBeenCalledWith(AGENDAR_PATH, { scroll: false });
  });
});
