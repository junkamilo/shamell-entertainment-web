/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

const pathnameRef = { current: "/" };

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameRef.current,
}));

import HomeSectionHashScroll from "./HomeSectionHashScroll";

describe("HomeSectionHashScroll", () => {
  afterEach(() => {
    cleanup();
    pathnameRef.current = "/";
    window.history.replaceState(null, "", "/");
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("scrolls to the hashed section on home then stops", () => {
    vi.useFakeTimers();
    window.history.replaceState(null, "", "/#services");

    const section = document.createElement("section");
    section.id = "services";
    Object.defineProperty(section, "getBoundingClientRect", {
      value: () => ({
        top: 400,
        bottom: 800,
        left: 0,
        right: 0,
        width: 100,
        height: 400,
      }),
    });
    document.body.appendChild(section);

    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    const { unmount } = render(<HomeSectionHashScroll />);
    vi.runAllTimers();
    unmount();

    expect(scrollTo).toHaveBeenCalled();
    section.remove();
  });

  it("stops forcing scroll when the user scrolls", () => {
    vi.useFakeTimers();
    window.history.replaceState(null, "", "/#services");

    const section = document.createElement("section");
    section.id = "services";
    Object.defineProperty(section, "getBoundingClientRect", {
      value: () => ({
        top: 400,
        bottom: 800,
        left: 0,
        right: 0,
        width: 100,
        height: 400,
      }),
    });
    document.body.appendChild(section);

    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    render(<HomeSectionHashScroll />);
    const callsAfterMount = scrollTo.mock.calls.length;

    window.dispatchEvent(new Event("wheel"));
    vi.advanceTimersByTime(1000);

    expect(scrollTo.mock.calls.length).toBe(callsAfterMount);
    section.remove();
  });

  it("does nothing when pathname is not home", () => {
    vi.useFakeTimers();
    pathnameRef.current = "/contacto";
    window.history.replaceState(null, "", "/contacto");
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    const { unmount } = render(<HomeSectionHashScroll />);
    vi.runAllTimers();
    unmount();

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
