/** @vitest-environment jsdom */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { reducer, toast, useToast } from "./use-toast";

describe("useToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    const { result, unmount } = renderHook(() => useToast());
    act(() => {
      result.current.dismiss();
    });
    act(() => {
      vi.advanceTimersByTime(1_000_001);
    });
    unmount();
    vi.useRealTimers();
  });

  it("adds a toast through the hook API", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: "Saved" });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]?.title).toBe("Saved");
    expect(result.current.toasts[0]?.open).toBe(true);
  });

  it("dismisses toasts and removes them after the delay", () => {
    const { result } = renderHook(() => useToast());

    let id = "";
    act(() => {
      id = result.current.toast({ title: "Bye" }).id;
    });

    act(() => {
      result.current.dismiss(id);
    });
    expect(result.current.toasts[0]?.open).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1_000_001);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it("exposes a standalone toast() helper", () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      toast({ title: "Standalone" });
    });
    expect(result.current.toasts.some((t) => t.title === "Standalone")).toBe(
      true,
    );
  });
});

describe("toast reducer", () => {
  it("limits to one toast and updates/removes by id", () => {
    const first = {
      id: "1",
      title: "One",
      open: true,
    };
    const second = {
      id: "2",
      title: "Two",
      open: true,
    };

    let state = reducer({ toasts: [] }, { type: "ADD_TOAST", toast: first });
    state = reducer(state, { type: "ADD_TOAST", toast: second });
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0]?.id).toBe("2");

    state = reducer(state, {
      type: "UPDATE_TOAST",
      toast: { id: "2", title: "Updated" },
    });
    expect(state.toasts[0]?.title).toBe("Updated");

    state = reducer(state, { type: "REMOVE_TOAST", toastId: "2" });
    expect(state.toasts).toHaveLength(0);
  });
});
