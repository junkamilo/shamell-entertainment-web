/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { useHeaderNavOverflow } from "./use-header-nav-fits";

describe("useHeaderNavOverflow", () => {
  it("returns false when disabled", async () => {
    const rowRef = createRef<HTMLElement>();
    const { result } = renderHook(() =>
      useHeaderNavOverflow(rowRef, false),
    );
    await waitFor(() => expect(result.current).toBe(false));
  });

  it("detects overflow when scrollWidth exceeds clientWidth", async () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "scrollWidth", { value: 400, configurable: true });
    Object.defineProperty(el, "clientWidth", { value: 200, configurable: true });
    const rowRef = { current: el };

    const { result } = renderHook(() =>
      useHeaderNavOverflow(rowRef, true),
    );
    await waitFor(() => expect(result.current).toBe(true));
  });

  it("returns false when the row fits", async () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "scrollWidth", { value: 200, configurable: true });
    Object.defineProperty(el, "clientWidth", { value: 200, configurable: true });
    const rowRef = { current: el };

    const { result } = renderHook(() =>
      useHeaderNavOverflow(rowRef, true),
    );
    await waitFor(() => expect(result.current).toBe(false));
  });
});
