/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ADMIN_SESSION_CHANGED_EVENT } from "@/lib/admin/session";

const pathnameRef = vi.hoisted(() => ({ current: "/" }));
const settingsState = vi.hoisted(() => ({ clientEnabled: true }));
const overflowState = vi.hoisted(() => ({ current: false }));
const adminState = vi.hoisted(() => ({ loggedIn: false }));
const scrollIdsOverride = vi.hoisted(() => ({
  current: null as string[] | null,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameRef.current,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({
    alt,
    ...rest
  }: {
    alt?: string;
  } & React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt ?? ""} {...rest} />
  ),
}));

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    header: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) => (
      <header {...props}>{children}</header>
    ),
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
    nav: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) => (
      <nav {...props}>{children}</nav>
    ),
    span: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLSpanElement> & { children?: React.ReactNode }) => (
      <span {...props}>{children}</span>
    ),
    a: ({
      children,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
      children?: React.ReactNode;
    }) => <a {...props}>{children}</a>,
  },
}));

vi.mock("@/hooks/use-on-coming-events-settings", () => ({
  useOnComingEventsSettings: () => ({
    clientEnabled: settingsState.clientEnabled,
  }),
}));

vi.mock("@/hooks/use-header-nav-fits", () => ({
  useHeaderNavOverflow: () => overflowState.current,
}));

vi.mock("@/lib/admin/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/admin/session")>();
  return {
    ...actual,
    isAdminLoggedIn: () => adminState.loggedIn,
  };
});

vi.mock("../lib/site-header-nav", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/site-header-nav")>();
  return {
    ...actual,
    syncHomeSectionHash: vi.fn(),
    buildHomeScrollSectionIds: (enabled: boolean) => {
      if (scrollIdsOverride.current) return scrollIdsOverride.current;
      return actual.buildHomeScrollSectionIds(enabled);
    },
  };
});

function stubMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("min-width: 1024px") ? matches : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

import SiteHeader from "./SiteHeader";

describe("SiteHeader", () => {
  beforeEach(() => {
    pathnameRef.current = "/";
    settingsState.clientEnabled = true;
    overflowState.current = false;
    adminState.loggedIn = false;
    scrollIdsOverride.current = null;
    stubMatchMedia(true);
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    document.body.style.overflow = "";
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.style.overflow = "";
  });

  it("renders desktop nav with Inquire and on-coming when enabled", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
    expect(screen.getAllByText("Inquire").length).toBeGreaterThan(0);
    expect(screen.getByText("ON COMING EVENTS")).toBeInTheDocument();
  });

  it("hides on-coming nav when settings disable it", () => {
    settingsState.clientEnabled = false;
    render(<SiteHeader />);
    expect(screen.queryByText("ON COMING EVENTS")).toBeNull();
  });

  it("marks gallery active off-home", () => {
    pathnameRef.current = "/gallery";
    render(<SiteHeader />);
    const gallery = screen.getByRole("link", { name: /GALLERY/i });
    expect(gallery.className).toMatch(/border-gold/);
  });

  it("marks contacto active for inquire path", () => {
    pathnameRef.current = "/contacto";
    render(<SiteHeader />);
    expect(screen.getAllByText("Inquire").length).toBeGreaterThan(0);
  });

  it("marks on-coming active on hub routes", () => {
    pathnameRef.current = "/on-coming-events/gala";
    render(<SiteHeader />);
    expect(screen.getByText("ON COMING EVENTS").closest("a")?.className).toMatch(
      /border-gold|text-gold/,
    );
  });

  it("shows admin entry when logged in and updates on session event", async () => {
    adminState.loggedIn = true;
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "Admin panel" })).toHaveAttribute(
      "href",
      "/admin",
    );

    adminState.loggedIn = false;
    await act(async () => {
      window.dispatchEvent(new Event(ADMIN_SESSION_CHANGED_EVENT));
    });
    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "Admin panel" })).toBeNull();
    });
  });

  it("opens mobile menu, locks body, and closes on Escape", async () => {
    stubMatchMedia(false);
    const user = userEvent.setup();
    render(<SiteHeader />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("navigation", { name: "Mobile menu" })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("navigation", { name: "Mobile menu" })).toBeNull();
    });
    expect(document.body.style.overflow).toBe("");
  });

  it("closes mobile menu via overlay click and shows admin in drawer", async () => {
    stubMatchMedia(false);
    adminState.loggedIn = true;
    const user = userEvent.setup();
    render(<SiteHeader />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByText("ADMIN PANEL")).toBeInTheDocument();

    const overlay = document.querySelector(".fixed.inset-0.z-80");
    expect(overlay).toBeTruthy();
    fireEvent.click(overlay!);
    await waitFor(() => {
      expect(screen.queryByRole("navigation", { name: "Mobile menu" })).toBeNull();
    });
  });

  it("closes mobile menu from Inquire and Admin panel links", async () => {
    stubMatchMedia(false);
    adminState.loggedIn = true;
    const user = userEvent.setup();
    const { unmount } = render(<SiteHeader />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("link", { name: "Inquire" }));
    await waitFor(() => {
      expect(screen.queryByRole("navigation", { name: "Mobile menu" })).toBeNull();
    });
    unmount();

    render(<SiteHeader />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("link", { name: /ADMIN PANEL/i }));
    await waitFor(() => {
      expect(screen.queryByRole("navigation", { name: "Mobile menu" })).toBeNull();
    });
  });

  it("uses empty activeHref for unmatched public routes", () => {
    pathnameRef.current = "/experiences/gala";
    render(<SiteHeader />);
    expect(screen.getAllByText("Inquire").length).toBeGreaterThan(0);
  });

  it("forces hamburger when desktop nav overflows", () => {
    overflowState.current = true;
    stubMatchMedia(true);
    render(<SiteHeader />);
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
  });

  it("elevates header after scroll", () => {
    render(<SiteHeader />);
    Object.defineProperty(window, "scrollY", { configurable: true, value: 40 });
    fireEvent.scroll(window);
    expect(document.querySelector("header")).toBeTruthy();
  });

  it("updates active section from scroll spy on home", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const about = document.createElement("section");
    about.id = "about";
    Object.defineProperty(about, "getBoundingClientRect", {
      value: () => ({ top: -50, bottom: 200, left: 0, right: 0, width: 100, height: 250 }),
    });
    document.body.appendChild(about);

    const gallery = document.createElement("section");
    gallery.id = "gallery";
    Object.defineProperty(gallery, "getBoundingClientRect", {
      value: () => ({ top: 2000, bottom: 2400, left: 0, right: 0, width: 100, height: 400 }),
    });
    document.body.appendChild(gallery);

    render(<SiteHeader />);
    Object.defineProperty(window, "scrollY", { configurable: true, value: 200 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    await act(async () => {
      fireEvent.scroll(window);
      vi.advanceTimersByTime(150);
    });
    about.remove();
    gallery.remove();
  });

  it("falls back to hero when scroll section ids are empty", async () => {
    scrollIdsOverride.current = [];
    render(<SiteHeader />);
    expect(screen.getAllByText("Inquire").length).toBeGreaterThan(0);
  });

  it("falls back to hero href when active section is unknown", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    scrollIdsOverride.current = ["mystery"];
    const mystery = document.createElement("section");
    mystery.id = "mystery";
    Object.defineProperty(mystery, "getBoundingClientRect", {
      value: () => ({ top: -10, bottom: 100, left: 0, right: 0, width: 100, height: 110 }),
    });
    document.body.appendChild(mystery);
    render(<SiteHeader />);
    Object.defineProperty(window, "scrollY", { configurable: true, value: 50 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    await act(async () => {
      fireEvent.scroll(window);
      vi.advanceTimersByTime(150);
    });
    expect(screen.getAllByText("Inquire").length).toBeGreaterThan(0);
    mystery.remove();
  });

  it("ignores non-Escape keydowns while mobile menu is open", async () => {
    stubMatchMedia(false);
    const user = userEvent.setup();
    render(<SiteHeader />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.getByRole("navigation", { name: "Mobile menu" })).toBeInTheDocument();
  });

  it("closes menu link navigation on mobile", async () => {
    stubMatchMedia(false);
    const user = userEvent.setup();
    render(<SiteHeader />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("link", { name: "ABOUT" }));
    await waitFor(() => {
      expect(screen.queryByRole("navigation", { name: "Mobile menu" })).toBeNull();
    });
  });
});
