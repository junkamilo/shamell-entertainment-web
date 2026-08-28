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

  it("cleans hash for #hero without forcing scroll", () => {
    vi.useFakeTimers();
    window.history.replaceState(null, "", "/#hero");
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    const { unmount } = render(<HomeSectionHashScroll />);
    vi.runAllTimers();
    unmount();

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("no-ops when there is no section hash", () => {
    vi.useFakeTimers();
    window.history.replaceState(null, "", "/");
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    const { unmount } = render(<HomeSectionHashScroll />);
    vi.runAllTimers();
    unmount();
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("sets scrollRestoration to manual and restores on cleanup", () => {
    vi.useFakeTimers();
    window.history.replaceState(null, "", "/#services");
    Object.defineProperty(window.history, "scrollRestoration", {
      configurable: true,
      writable: true,
      value: "auto",
    });

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
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    const { unmount } = render(<HomeSectionHashScroll />);
    expect(window.history.scrollRestoration).toBe("manual");
    unmount();
    expect(window.history.scrollRestoration).toBe("auto");
    section.remove();
  });

  it("releases the hash lock after a successful late retry", () => {
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
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    render(<HomeSectionHashScroll />);
    vi.advanceTimersByTime(480);
    vi.advanceTimersByTime(300);
    section.remove();
  });

  it("skips cancelled retry callbacks when clearTimeout is a no-op", () => {
    vi.useFakeTimers();
    window.history.replaceState(null, "", "/#services");
    vi.spyOn(window, "clearTimeout").mockImplementation(() => undefined);
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);

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
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    render(<HomeSectionHashScroll />);
    window.dispatchEvent(new Event("wheel"));
    vi.advanceTimersByTime(1000);
    section.remove();
  });

  it("retries until the section mounts", () => {
    vi.useFakeTimers();
    window.history.replaceState(null, "", "/#services");
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    render(<HomeSectionHashScroll />);
    expect(scrollTo).not.toHaveBeenCalled();

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

    vi.advanceTimersByTime(80);
    expect(scrollTo).toHaveBeenCalled();
    section.remove();
  });
});
