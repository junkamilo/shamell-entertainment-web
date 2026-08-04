import { describe, expect, it } from "vitest";
import {
  ON_COMING_EVENTS_ADMIN_PATH,
  ON_COMING_EVENTS_LAYOUT_ADMIN_PATH,
  ON_COMING_EVENTS_PUBLIC_PATH,
  ON_COMING_EVENTS_SITE_TAB_RESERVATION,
  ON_COMING_EVENTS_SITE_TAB_UPCOMING,
  SEATING_LAYOUT_ADMIN_LABEL,
  VENUE_LAYOUT_PROMO_ADMIN_PATH,
  VENUE_LAYOUT_PUBLIC_PATH,
  onComingEventsSiteAdminHref,
  parseOnComingEventsSiteTab,
} from "./onComingEventsRoutes";

describe("onComingEventsRoutes constants", () => {
  it("exposes public, admin, and layout paths", () => {
    expect(ON_COMING_EVENTS_PUBLIC_PATH).toBe("/on-coming-events");
    expect(ON_COMING_EVENTS_ADMIN_PATH).toBe("/admin/on-coming-events");
    expect(ON_COMING_EVENTS_LAYOUT_ADMIN_PATH).toBe(
      "/admin/on-coming-events/layout",
    );
    expect(SEATING_LAYOUT_ADMIN_LABEL).toBe("Seating layout");
  });

  it("keeps deprecated venue-layout aliases aligned", () => {
    expect(VENUE_LAYOUT_PUBLIC_PATH).toBe(ON_COMING_EVENTS_PUBLIC_PATH);
    expect(VENUE_LAYOUT_PROMO_ADMIN_PATH).toBe(ON_COMING_EVENTS_ADMIN_PATH);
  });
});

describe("onComingEventsSiteAdminHref", () => {
  it("defaults to the upcoming admin path", () => {
    expect(onComingEventsSiteAdminHref()).toBe(ON_COMING_EVENTS_ADMIN_PATH);
    expect(onComingEventsSiteAdminHref(ON_COMING_EVENTS_SITE_TAB_UPCOMING)).toBe(
      ON_COMING_EVENTS_ADMIN_PATH,
    );
  });

  it("appends reservation tab query", () => {
    expect(
      onComingEventsSiteAdminHref(ON_COMING_EVENTS_SITE_TAB_RESERVATION),
    ).toBe(`${ON_COMING_EVENTS_ADMIN_PATH}?tab=reservation`);
  });
});

describe("parseOnComingEventsSiteTab", () => {
  it("maps reservation and falls back to upcoming", () => {
    expect(parseOnComingEventsSiteTab("reservation")).toBe(
      ON_COMING_EVENTS_SITE_TAB_RESERVATION,
    );
    expect(parseOnComingEventsSiteTab("upcoming")).toBe(
      ON_COMING_EVENTS_SITE_TAB_UPCOMING,
    );
    expect(parseOnComingEventsSiteTab(null)).toBe(
      ON_COMING_EVENTS_SITE_TAB_UPCOMING,
    );
    expect(parseOnComingEventsSiteTab("other")).toBe(
      ON_COMING_EVENTS_SITE_TAB_UPCOMING,
    );
  });
});
