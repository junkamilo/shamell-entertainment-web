/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ON_COMING_EVENTS_ADMIN_PATH,
  VENUE_RESERVATIONS_ADMIN_PATH,
} from "@/lib/admin/routes";
import { makeUpcomingEventsNavGroup } from "../test/fixtures/shell.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { UPCOMING_EVENTS_NAV_EXPANDED_KEY } from "../config/nav.config";
import { NavGroup } from "./NavGroup";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
    title?: string;
    className?: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("NavGroup", () => {
  const onNavigate = vi.fn();
  const group = makeUpcomingEventsNavGroup();

  beforeEach(() => {
    onNavigate.mockClear();
    sessionStorage.clear();
  });

  it("renders group label and expands children when active", () => {
    renderWithProviders(
      <NavGroup
        group={group}
        pathname={ON_COMING_EVENTS_ADMIN_PATH}
        sidebarCollapsed={false}
        reservationsBadgeCount={0}
        onNavigate={onNavigate}
      />,
    );

    expect(
      screen.getByRole("button", { name: /upcoming events/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /on coming events \(site\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /seat reservations/i }),
    ).toHaveAttribute("href", VENUE_RESERVATIONS_ADMIN_PATH);
  });

  it("toggles expanded state and persists to sessionStorage", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <NavGroup
        group={group}
        pathname="/admin/agenda"
        sidebarCollapsed={false}
        reservationsBadgeCount={0}
        onNavigate={onNavigate}
      />,
    );

    const toggle = screen.getByRole("button", { name: /upcoming events/i });
    await user.click(toggle);
    expect(sessionStorage.getItem(UPCOMING_EVENTS_NAV_EXPANDED_KEY)).toBe(
      "true",
    );
    expect(
      screen.getByRole("link", { name: /seat reservations/i }),
    ).toBeInTheDocument();
  });

  it("shows reservation badge on child when count > 0", () => {
    sessionStorage.setItem(UPCOMING_EVENTS_NAV_EXPANDED_KEY, "true");
    renderWithProviders(
      <NavGroup
        group={group}
        pathname="/admin/agenda"
        sidebarCollapsed={false}
        reservationsBadgeCount={4}
        onNavigate={onNavigate}
      />,
    );

    expect(
      screen.getAllByLabelText("4 new notifications").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("opens flyout menu when sidebar is collapsed", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <NavGroup
        group={group}
        pathname="/admin/agenda"
        sidebarCollapsed
        reservationsBadgeCount={0}
        onNavigate={onNavigate}
      />,
    );

    await user.click(screen.getByRole("button", { name: /upcoming events/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /seat reservations/i }),
    ).toBeInTheDocument();
  });

  it("calls onNavigate when a child link is clicked", async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(UPCOMING_EVENTS_NAV_EXPANDED_KEY, "true");
    renderWithProviders(
      <NavGroup
        group={group}
        pathname="/admin/agenda"
        sidebarCollapsed={false}
        reservationsBadgeCount={0}
        onNavigate={onNavigate}
      />,
    );

    await user.click(
      screen.getByRole("link", { name: /seat reservations/i }),
    );
    expect(onNavigate).toHaveBeenCalled();
  });
});
