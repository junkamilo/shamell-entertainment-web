/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useAboutHeroLightbox } from "./useAboutHeroLightbox";

describe("useAboutHeroLightbox", () => {
  it("marks the portal ready after mount", () => {
    const { result } = renderHook(() => useAboutHeroLightbox());
    expect(result.current.lightboxPortalReady).toBe(true);
  });

  it("opens with display and soft-closes without clearing display", () => {
    const { result } = renderHook(() => useAboutHeroLightbox());

    act(() => {
      result.current.openHeroLightbox("https://cdn.test/hero.jpg", false);
    });

    expect(result.current.isPreviewLightboxOpen).toBe(true);
    expect(result.current.lightboxDisplay).toEqual({
      src: "https://cdn.test/hero.jpg",
      isVideo: false,
    });

    act(() => {
      result.current.closeHeroLightbox();
    });

    expect(result.current.isPreviewLightboxOpen).toBe(false);
    expect(result.current.lightboxDisplay).toEqual({
      src: "https://cdn.test/hero.jpg",
      isVideo: false,
    });
  });

  it("instant-closes and clears display", () => {
    const { result } = renderHook(() => useAboutHeroLightbox());

    act(() => {
      result.current.openHeroLightbox("https://cdn.test/hero.mp4", true);
    });
    act(() => {
      result.current.closeHeroLightbox(true);
    });

    expect(result.current.isPreviewLightboxOpen).toBe(false);
    expect(result.current.lightboxDisplay).toBeNull();
  });

  it("clears display on exit complete", () => {
    const { result } = renderHook(() => useAboutHeroLightbox());

    act(() => {
      result.current.openHeroLightbox("https://cdn.test/hero.jpg", false);
    });
    act(() => {
      result.current.closeHeroLightbox();
    });
    act(() => {
      result.current.onLightboxExitComplete();
    });

    expect(result.current.lightboxDisplay).toBeNull();
  });

  it("locks body scroll while open", () => {
    const { result } = renderHook(() => useAboutHeroLightbox());
    const previous = document.body.style.overflow;

    act(() => {
      result.current.openHeroLightbox("https://cdn.test/hero.jpg", false);
    });
    expect(document.body.style.overflow).toBe("hidden");

    act(() => {
      result.current.closeHeroLightbox(true);
    });
    expect(document.body.style.overflow).toBe(previous);
  });
});
