/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { useStripeOverlayBodyLock } from "./useStripeOverlayBodyLock";

function LockProbe({ enabled }: { enabled: boolean }) {
  useStripeOverlayBodyLock(enabled);
  return <div data-testid="probe" />;
}

describe("useStripeOverlayBodyLock", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    document.body.style.overflow = "";
  });

  it("locks body overflow when enabled and restores on disable", () => {
    document.body.style.overflow = "auto";

    const { rerender } = render(<LockProbe enabled />);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<LockProbe enabled={false} />);
    expect(document.body.style.overflow).toBe("auto");
  });

  it("restores previous overflow on unmount while enabled", () => {
    document.body.style.overflow = "scroll";
    const { unmount } = render(<LockProbe enabled />);
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("scroll");
  });
});
