/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePublicCheckoutModalLock } from "./usePublicCheckoutModalLock";

describe("usePublicCheckoutModalLock", () => {
  it("locks body and marks checkout modal while enabled", () => {
    document.body.style.overflow = "auto";
    document.body.removeAttribute("data-public-checkout-modal");

    const { rerender, unmount } = renderHook(
      ({ enabled }) => usePublicCheckoutModalLock(enabled),
      { initialProps: { enabled: true } },
    );

    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.getAttribute("data-public-checkout-modal")).toBe("open");

    rerender({ enabled: false });
    expect(document.body.style.overflow).toBe("auto");
    expect(document.body.hasAttribute("data-public-checkout-modal")).toBe(false);

    unmount();
  });
});
