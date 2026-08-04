/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { createRef } from "react";
import { useDismissOnOutsideOrEscape } from "./useDismissOnOutsideOrEscape";

describe("useDismissOnOutsideOrEscape", () => {
  it("does not call onClose when closed", () => {
    const onClose = vi.fn();
    const containerRef = createRef<HTMLDivElement>();
    renderHook(() =>
      useDismissOnOutsideOrEscape({ open: false, onClose, containerRef }),
    );
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose on Escape when open", () => {
    const onClose = vi.fn();
    const containerRef = createRef<HTMLDivElement>();
    renderHook(() =>
      useDismissOnOutsideOrEscape({ open: true, onClose, containerRef }),
    );
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
