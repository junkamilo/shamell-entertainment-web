/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildHomeScrollSectionIds,
  buildSiteHeaderNavItems,
  desktopNavItems,
  homeSectionHref,
  homeSectionScrollTop,
  isHomeHashScrollLocked,
  lockHomeHashScroll,
  readHomeHashSectionId,
  scrollWindowToHomeSection,
  syncHomeSectionHash,
} from "./site-header-nav";

describe("homeSectionHref", () => {
  it("builds a home hash link for a section id", () => {
    expect(homeSectionHref("services")).toBe("/#services");
    expect(homeSectionHref("gallery")).toBe("/#gallery");
  });
});

describe("buildSiteHeaderNavItems", () => {
  it("omits on-coming events when disabled", () => {
    const items = buildSiteHeaderNavItems(false);
    expect(items.some((i) => i.sectionId === "on-coming-events")).toBe(false);
    expect(items.some((i) => i.sectionId === "gallery")).toBe(true);
  });

  it("inserts on-coming events before gallery when enabled", () => {
    const items = buildSiteHeaderNavItems(true);
    const ids = items.map((i) => i.sectionId);
    expect(ids.indexOf("on-coming-events")).toBeLessThan(ids.indexOf("gallery"));
  });
});

describe("buildHomeScrollSectionIds", () => {
  it("filters on-coming when disabled", () => {
    expect(buildHomeScrollSectionIds(false)).not.toContain("on-coming-events");
  });

  it("includes on-coming when enabled", () => {
    expect(buildHomeScrollSectionIds(true)).toContain("on-coming-events");
  });
});

describe("desktopNavItems", () => {
  it("returns all items when not compact", () => {
    const items = buildSiteHeaderNavItems(false);
    expect(desktopNavItems(items, false)).toEqual(items);
  });

  it("hides compact-hidden items", () => {
    const items = buildSiteHeaderNavItems(false);
    const compact = desktopNavItems(items, true);
    expect(compact.every((i) => !i.hideInCompactNav)).toBe(true);
  });
});

describe("readHomeHashSectionId", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("returns null off home pathname", () => {
    window.history.replaceState(null, "", "/gallery#x");
    expect(readHomeHashSectionId()).toBeNull();
  });

  it("returns null when hash is empty", () => {
    window.history.replaceState(null, "", "/");
    expect(readHomeHashSectionId()).toBeNull();
  });

  it("returns the section id from hash", () => {
    window.history.replaceState(null, "", "/#services");
    expect(readHomeHashSectionId()).toBe("services");
  });
});

describe("homeSectionScrollTop / scrollWindowToHomeSection", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("computes scroll top with header offset", () => {
    const el = document.createElement("section");
    Object.defineProperty(el, "getBoundingClientRect", {
      value: () => ({ top: 400, bottom: 800, left: 0, right: 0, width: 100, height: 400 }),
    });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 100 });
    expect(homeSectionScrollTop(el)).toBeGreaterThanOrEqual(0);
  });

  it("scrolls when section exists and returns false otherwise", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    expect(scrollWindowToHomeSection("missing")).toBe(false);

    const section = document.createElement("section");
    section.id = "services";
    Object.defineProperty(section, "getBoundingClientRect", {
      value: () => ({ top: 200, bottom: 400, left: 0, right: 0, width: 100, height: 200 }),
    });
    document.body.appendChild(section);
    expect(scrollWindowToHomeSection("services")).toBe(true);
    expect(scrollTo).toHaveBeenCalled();
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

  it("no-ops for blank section ids", () => {
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
    lockHomeHashScroll(0);
    syncHomeSectionHash("   ");
    expect(replaceState).not.toHaveBeenCalled();
  });
});
