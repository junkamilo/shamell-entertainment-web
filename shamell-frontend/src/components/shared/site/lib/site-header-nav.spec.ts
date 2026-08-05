import { afterEach, describe, expect, it, vi } from "vitest";
import {
  homeSectionHref,
  isHomeHashScrollLocked,
  lockHomeHashScroll,
  syncHomeSectionHash,
} from "./site-header-nav";

describe("homeSectionHref", () => {
  it("builds a home hash link for a section id", () => {
    expect(homeSectionHref("services")).toBe("/#services");
    expect(homeSectionHref("gallery")).toBe("/#gallery");
  });
});

describe("syncHomeSectionHash", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    lockHomeHashScroll(0);
  });

  it("replaceStates hash when on home and hash differs", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
      location: {
        pathname: "/",
        search: "",
        hash: "#on-coming-events",
      },
      history: {
        state: { idx: 0 },
        replaceState,
      },
    });
    // Ensure lock is expired
    lockHomeHashScroll(0);

    syncHomeSectionHash("services");

    expect(replaceState).toHaveBeenCalledWith({ idx: 0 }, "", "/#services");
  });

  it("clears hash when active section is hero", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
      location: {
        pathname: "/",
        search: "",
        hash: "#services",
      },
      history: {
        state: { idx: 0 },
        replaceState,
      },
    });
    lockHomeHashScroll(0);

    syncHomeSectionHash("hero");

    expect(replaceState).toHaveBeenCalledWith({ idx: 0 }, "", "/");
  });

  it("no-ops when hash already matches", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
      location: {
        pathname: "/",
        search: "",
        hash: "#gallery",
      },
      history: {
        state: null,
        replaceState,
      },
    });
    lockHomeHashScroll(0);

    syncHomeSectionHash("gallery");

    expect(replaceState).not.toHaveBeenCalled();
  });

  it("no-ops when not on the home pathname", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
      location: {
        pathname: "/gallery",
        search: "",
        hash: "",
      },
      history: {
        state: null,
        replaceState,
      },
    });
    lockHomeHashScroll(0);

    syncHomeSectionHash("gallery");

    expect(replaceState).not.toHaveBeenCalled();
  });

  it("no-ops while hash scroll is locked", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
      location: {
        pathname: "/",
        search: "",
        hash: "#services",
      },
      history: {
        state: null,
        replaceState,
      },
    });
    lockHomeHashScroll(5000);
    expect(isHomeHashScrollLocked()).toBe(true);

    syncHomeSectionHash("on-coming-events");

    expect(replaceState).not.toHaveBeenCalled();
  });
});
