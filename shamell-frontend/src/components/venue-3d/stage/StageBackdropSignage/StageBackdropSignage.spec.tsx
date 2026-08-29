/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";

vi.mock("@react-three/drei", () => ({
  useTexture: () => ({
    clone: () => ({
      colorSpace: "",
      needsUpdate: false,
    }),
  }),
}));

import StageBackdropSignage from "./StageBackdropSignage";

describe("StageBackdropSignage", () => {
  it("builds the wordmark after fonts are ready", async () => {
    const { container } = render(<StageBackdropSignage />);
    await waitFor(() => {
      expect(container.querySelectorAll('[data-r3f="mesh"]').length).toBeGreaterThan(1);
    });
  });

  it("builds immediately when font loading is unavailable", () => {
    const fonts = document.fonts;
    Object.defineProperty(document, "fonts", { configurable: true, value: undefined });
    expect(() => render(<StageBackdropSignage />)).not.toThrow();
    Object.defineProperty(document, "fonts", { configurable: true, value: fonts });
  });

  it("returns an empty canvas texture when 2d context is missing", async () => {
    const spy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(null);
    const { default: Signage } = await import("./StageBackdropSignage");
    expect(() => render(<Signage />)).not.toThrow();
    spy.mockRestore();
  });

  it("cancels an in-flight wordmark on unmount", async () => {
    let resolveReady: (() => void) | undefined;
    const ready = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { ready },
    });
    const { unmount } = render(<StageBackdropSignage />);
    unmount();
    resolveReady?.();
    await ready;
  });
});
