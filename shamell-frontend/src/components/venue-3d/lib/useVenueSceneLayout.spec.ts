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
  });
});
