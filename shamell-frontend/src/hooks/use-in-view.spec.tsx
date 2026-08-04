/** @vitest-environment jsdom */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useInView } from "./use-in-view";

function Harness({ enabled = true }: { enabled?: boolean }) {
  const { ref, inView } = useInView<HTMLDivElement>({ enabled });
  return (
    <div ref={ref} data-testid="gate">
      {inView ? "yes" : "no"}
    </div>
  );
}

describe("useInView", () => {
  const OriginalIO = globalThis.IntersectionObserver;

  beforeEach(() => {
    class MockIO {
      private cb: IntersectionObserverCallback;
      constructor(cb: IntersectionObserverCallback) {
        this.cb = cb;
      }
      observe(target: Element) {
        this.cb(
          [
            {
              isIntersecting: true,
              target,
              intersectionRatio: 1,
            } as IntersectionObserverEntry,
          ],
          this as unknown as IntersectionObserver,
        );
      }
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
      root = null;
      rootMargin = "";
      thresholds = [];
    }
    vi.stubGlobal("IntersectionObserver", MockIO);
  });

  afterEach(() => {
    vi.stubGlobal("IntersectionObserver", OriginalIO);
  });

  it("stays false when disabled", async () => {
    render(<Harness enabled={false} />);
    expect(screen.getByTestId("gate").textContent).toBe("no");
  });

  it("tracks intersecting entries", async () => {
    render(<Harness />);
    await waitFor(() =>
      expect(screen.getByTestId("gate").textContent).toBe("yes"),
    );
  });
});
