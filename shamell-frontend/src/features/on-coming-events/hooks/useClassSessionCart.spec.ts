/** @vitest-environment jsdom */

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { useClassSessionCart } from "./useClassSessionCart";
import type { ClassCartItem } from "../types/classSessionCart.types";

const itemA: ClassCartItem = {
  sessionId: "s-a",
  dateIso: "2026-08-12",
  weekday: 3,
  sectionId: "sec-1",
  label: "Beginner",
  startTime: "18:00",
  endTime: "19:00",
  price: 25,
  capacity: 10,
  seatsRemaining: 5,
};

const itemB: ClassCartItem = {
  ...itemA,
  sessionId: "s-b",
  dateIso: "2026-08-13",
  weekday: 4,
  label: "Advanced",
  price: 30,
};

describe("useClassSessionCart", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("replaces items for a date without dropping other days", async () => {
    const { result } = renderHook(() => useClassSessionCart("salsa"));
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    act(() => {
      result.current.replaceDay("2026-08-12", [itemA]);
      result.current.replaceDay("2026-08-13", [itemB]);
    });
    expect(result.current.count).toBe(2);
    expect(result.current.total).toBe(55);

    act(() => {
      result.current.replaceDay("2026-08-12", [
        { ...itemA, sessionId: "s-a2", price: 40 },
      ]);
    });
    expect(result.current.items.map((i) => i.sessionId).sort()).toEqual([
      "s-a2",
      "s-b",
    ]);
    expect(result.current.total).toBe(70);
  });

  it("persists to sessionStorage", async () => {
    const { result, unmount } = renderHook(() => useClassSessionCart("salsa"));
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    act(() => {
      result.current.replaceDay("2026-08-12", [itemA]);
    });
    await waitFor(() =>
      expect(sessionStorage.getItem("shamell:class-cart:salsa")).toContain("s-a"),
    );
    unmount();
    const { result: again } = renderHook(() => useClassSessionCart("salsa"));
    await waitFor(() => expect(again.current.items).toHaveLength(1));
    expect(again.current.items[0]?.sessionId).toBe("s-a");
  });
});
