/** @vitest-environment jsdom */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { createMatchMediaMock } from "../test/helpers/mockHooksPage";
import { useMediaQuery } from "./use-media-query";

describe("useMediaQuery", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    window.matchMedia = createMatchMediaMock(true);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("returns matchMedia.matches on the client", () => {
    const { result } = renderHook(() =>
      useMediaQuery("(min-width: 1024px)"),
    );
    expect(result.current).toBe(true);
  });

  it("re-subscribes when the query changes", () => {
    window.matchMedia = createMatchMediaMock(false);
    const { result, rerender } = renderHook(
      ({ q }: { q: string }) => useMediaQuery(q),
      { initialProps: { q: "(max-width: 600px)" } },
    );
    expect(result.current).toBe(false);

    window.matchMedia = createMatchMediaMock(true);
    rerender({ q: "(min-width: 1200px)" });
    expect(result.current).toBe(true);
  });
});
