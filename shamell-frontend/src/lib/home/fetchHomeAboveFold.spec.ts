/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it } from "vitest";
import { HttpResponse, http } from "msw";
import { server } from "@/test/server";
import { fallbackAboutContent } from "@/lib/about/aboutContent";
import { DEFAULT_HEADER_TEXT } from "@/lib/header-media/headerTextTypes";
import { fetchHomeAboveFold } from "./fetchHomeAboveFold";
import {
  homeAboveFoldErrorHandler,
  homeAboveFoldHandler,
} from "./test/mocks/handlers";
import {
  makeHomeAboveFoldApiPayload,
  makeHomeOnComingSettings,
  makeHomeUpcomingEventApiItem,
} from "./test/fixtures/homeLib.fixture";
import {
  FIXTURE_HOME_ABOUT_TITLE,
  FIXTURE_HOME_EVENT_SLUG,
  FIXTURE_HOME_HEADLINE,
} from "./test/fixtures/uuids.fixture";

describe("fetchHomeAboveFold", () => {
  beforeEach(() => {
    server.use(homeAboveFoldHandler());
  });

  it("returns normalized data from the aggregated endpoint", async () => {
    const data = await fetchHomeAboveFold();
    expect(data.about.title).toBe(FIXTURE_HOME_ABOUT_TITLE);
    expect(data.headerPhotos).toHaveLength(1);
    expect(data.headerText.headline).toBe(FIXTURE_HOME_HEADLINE);
    expect(data.onComingSettings.clientEnabled).toBe(true);
    expect(data.upcomingEvents).toHaveLength(1);
    expect(data.upcomingEvents[0]?.slug).toBe(FIXTURE_HOME_EVENT_SLUG);
    expect(data.upcomingEvents[0]?.eventTypeName).toBe("Gala Night");
    expect(data.services).toHaveLength(1);
    expect(data.services[0]?.title).toBe("Fire Show");
    expect(data.generalEvents).toHaveLength(1);
    expect(data.generalEvents[0]?.eventTypeName).toBe("Private Gala");
  });

  it("clears upcoming events when clientEnabled is false", async () => {
    server.use(
      homeAboveFoldHandler(
        makeHomeAboveFoldApiPayload({
          onComingSettings: makeHomeOnComingSettings({ clientEnabled: false }),
          upcomingEvents: [makeHomeUpcomingEventApiItem()],
        }),
      ),
    );
    const data = await fetchHomeAboveFold();
    expect(data.onComingSettings.clientEnabled).toBe(false);
    expect(data.upcomingEvents).toEqual([]);
  });

  it("falls back to legacy fetches when aggregated endpoint fails", async () => {
    server.use(homeAboveFoldErrorHandler(503));
    // Legacy pieces are already served by about/header-media/hooks/on-coming handlers.
    const data = await fetchHomeAboveFold();
    expect(data.about).toBeTruthy();
    expect(data.headerText).toBeTruthy();
    expect(data.onComingSettings).toBeTruthy();
    expect(Array.isArray(data.headerPhotos)).toBe(true);
    expect(Array.isArray(data.upcomingEvents)).toBe(true);
    expect(Array.isArray(data.services)).toBe(true);
    expect(Array.isArray(data.generalEvents)).toBe(true);
  });

  it("falls back when aggregated JSON is null/invalid", async () => {
    server.use(
      http.get("*/api/v1/home/above-fold", () =>
        HttpResponse.text("null", { status: 200 }),
      ),
    );
    const data = await fetchHomeAboveFold();
    expect(data.about.title.length).toBeGreaterThan(0);
  });

  it("uses fallback about when aggregated about cannot be normalized", async () => {
    server.use(
      homeAboveFoldHandler(
        makeHomeAboveFoldApiPayload({
          about: { title: "incomplete" },
        }),
      ),
    );
    const data = await fetchHomeAboveFold();
    expect(data.about.title).toBe(fallbackAboutContent.title);
  });

  it("uses default header text when aggregated headerText is missing", async () => {
    server.use(
      homeAboveFoldHandler(
        makeHomeAboveFoldApiPayload({
          headerText: undefined,
        }),
      ),
    );
    const data = await fetchHomeAboveFold();
    expect(data.headerText.headline).toBe(DEFAULT_HEADER_TEXT.headline);
  });
});
