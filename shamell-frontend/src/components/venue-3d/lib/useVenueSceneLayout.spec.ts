/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const media = vi.hoisted(() => ({
  values: {
    phone: false,
    tablet: false,
    laptop: true,
    tv: false,
    coarse: false,
    reduced: false,
  },
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: (query: string) => {
    if (query.includes("max-width: 639px")) return media.values.phone;
    if (query.includes("min-width: 640px") && query.includes("1023px"))
      return media.values.tablet;
    if (query.includes("min-width: 1024px") && query.includes("1919px"))
      return media.values.laptop;
    if (query.includes("min-width: 1920px")) return media.values.tv;
    if (query.includes("pointer: coarse")) return media.values.coarse;
    if (query.includes("prefers-reduced-motion")) return media.values.reduced;
    return false;
  },
}));

import { useVenueSceneLayout } from "./useVenueSceneLayout";

describe("useVenueSceneLayout", () => {
  it("resolves laptop bucket and high perf", () => {
    const { result } = renderHook(() => useVenueSceneLayout("public"));
    expect(result.current.bucket).toBe("laptop");
    expect(result.current.perfProfile).toBe("high");
    expect(result.current.dpr).toEqual([1, 1.5]);
    expect(result.current.chromeCss).toBe("14rem");
  });

  it("resolves admin chrome and phone bucket", () => {
    media.values.laptop = false;
    media.values.phone = true;
    const { result } = renderHook(() => useVenueSceneLayout("admin"));
    expect(result.current.bucket).toBe("phone");
    expect(result.current.chromeCss).toBe("10rem");
    media.values.phone = false;
    media.values.laptop = true;
  });

  it("resolves tablet and tv buckets", () => {
    media.values.laptop = false;
    media.values.tablet = true;
    const tablet = renderHook(() => useVenueSceneLayout());
    expect(tablet.result.current.bucket).toBe("tablet");
    media.values.tablet = false;
    media.values.tv = true;
    const tv = renderHook(() => useVenueSceneLayout());
    expect(tv.result.current.bucket).toBe("tv");
    expect(tv.result.current.dpr).toEqual([1, 2]);
    media.values.tv = false;
    media.values.reduced = true;
    media.values.tv = true;
    const tvReduced = renderHook(() => useVenueSceneLayout());
    expect(tvReduced.result.current.dpr).toEqual([1, 1.5]);
    media.values.tv = false;
    media.values.reduced = false;
    media.values.laptop = false;
    media.values.tablet = false;
    media.values.phone = false;
    const phoneFallback = renderHook(() => useVenueSceneLayout());
    expect(phoneFallback.result.current.bucket).toBe("phone");
    media.values.laptop = true;
  });
});
