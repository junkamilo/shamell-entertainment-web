import { describe, expect, it } from "vitest";
import {
  AGENDA_HUB_PATH,
  AGREGAR_ADMIN_PATH,
  ON_COMING_EVENTS_ADMIN_PATH,
  ON_COMING_EVENTS_LAYOUT_ADMIN_PATH,
  SERVICES_PATH,
  VENUE_RESERVATIONS_ADMIN_PATH,
  VENUE_TABLES_PATH,
} from "@/lib/admin/routes";
import {
  adminBreadcrumbLabel,
  adminNavEntries,
  filterAdminNavEntries,
  isAdminNavGroupActive,
  isAdminNavLinkActive,
  isUpcomingEventsBreadcrumbRoute,
  upcomingEventsNavGroup,
  UPCOMING_EVENTS_NAV_EXPANDED_KEY,
  UPCOMING_EVENTS_NAV_GROUP_ID,
} from "./nav.config";
import { makeUpcomingEventsNavGroup } from "../test/fixtures/shell.fixture";

describe("nav.config", () => {
  it("exports upcoming-events group id and session key", () => {
    expect(UPCOMING_EVENTS_NAV_GROUP_ID).toBe("upcoming-events");
    expect(UPCOMING_EVENTS_NAV_EXPANDED_KEY).toBe(
      "admin-nav-upcoming-expanded",
    );
    expect(upcomingEventsNavGroup.id).toBe(UPCOMING_EVENTS_NAV_GROUP_ID);
  });

  it("matches agenda hub for nested routes", () => {
    expect(isAdminNavLinkActive(AGENDA_HUB_PATH, AGENDA_HUB_PATH)).toBe(true);
    expect(
      isAdminNavLinkActive(`${AGENDA_HUB_PATH}/peticiones`, AGENDA_HUB_PATH),
    ).toBe(true);
    expect(isAdminNavLinkActive(SERVICES_PATH, AGENDA_HUB_PATH)).toBe(false);
  });

  it("matches on-coming-events site path exactly (not layout)", () => {
    expect(
      isAdminNavLinkActive(
        ON_COMING_EVENTS_ADMIN_PATH,
        ON_COMING_EVENTS_ADMIN_PATH,
      ),
    ).toBe(true);
    expect(
      isAdminNavLinkActive(
        ON_COMING_EVENTS_LAYOUT_ADMIN_PATH,
        ON_COMING_EVENTS_ADMIN_PATH,
      ),
    ).toBe(false);
  });

  it("matches other links with prefix", () => {
    expect(isAdminNavLinkActive(SERVICES_PATH, SERVICES_PATH)).toBe(true);
    expect(
      isAdminNavLinkActive(`${SERVICES_PATH}/edit`, SERVICES_PATH),
    ).toBe(true);
  });

  it("detects active groups from children", () => {
    const group = makeUpcomingEventsNavGroup();
    expect(
      isAdminNavGroupActive(VENUE_RESERVATIONS_ADMIN_PATH, group),
    ).toBe(true);
    expect(isAdminNavGroupActive(AGENDA_HUB_PATH, group)).toBe(false);
  });

  it("filters entries by permissions", () => {
    const withAccess = filterAdminNavEntries(adminNavEntries, [
      "admin.access",
    ]);
    expect(
      withAccess.some(
        (e) => e.type === "link" && e.href === AGENDA_HUB_PATH,
      ),
    ).toBe(true);
    expect(
      withAccess.some(
        (e) => e.type === "link" && e.href === AGREGAR_ADMIN_PATH,
      ),
    ).toBe(false);

    const withInvite = filterAdminNavEntries(adminNavEntries, [
      "admin.access",
      "admin.invite",
    ]);
    expect(
      withInvite.some(
        (e) => e.type === "link" && e.href === AGREGAR_ADMIN_PATH,
      ),
    ).toBe(true);
  });

  it("hides groups when no children remain after filter", () => {
    const filtered = filterAdminNavEntries([upcomingEventsNavGroup], []);
    expect(filtered).toHaveLength(0);
  });

  it("maps breadcrumb labels and upcoming segments", () => {
    expect(adminBreadcrumbLabel.agenda).toBe("Agenda");
    expect(adminBreadcrumbLabel["on-coming-events"]).toBe(
      "On Coming Events (site)",
    );
    expect(isUpcomingEventsBreadcrumbRoute("on-coming-events")).toBe(true);
    expect(isUpcomingEventsBreadcrumbRoute("venue-tables")).toBe(true);
    expect(isUpcomingEventsBreadcrumbRoute(VENUE_TABLES_PATH)).toBe(false);
    expect(isUpcomingEventsBreadcrumbRoute("services")).toBe(false);
  });

  it("includes seating layout and seat reservations in upcoming group", () => {
    const hrefs = upcomingEventsNavGroup.children.map((c) => c.href);
    expect(hrefs).toContain(ON_COMING_EVENTS_LAYOUT_ADMIN_PATH);
    expect(hrefs).toContain(VENUE_RESERVATIONS_ADMIN_PATH);
    expect(hrefs).toContain(VENUE_TABLES_PATH);
  });
});
