/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import {
  makeOnComingPromo,
  makeUpcomingEventApiItem,
} from "./fixtures/onComingEventsLib.fixture";
import { FIXTURE_EVENT_SLUG } from "./fixtures/uuids.fixture";
import { createMockOnComingSettingsState } from "./helpers/mockOnComingEventsLib";
import { ON_COMING_EVENTS_PUBLIC_PATH } from "../onComingEventsRoutes";
import { normalizeOnComingSettings } from "../onComingSettings";
import { mapPublicUpcomingHubEvents } from "../mapPublicUpcomingHubEvents";
import { onComingEventDetailHref } from "../upcomingEventPublicRoutes";

describe("on-coming-events lib test environment", () => {
  it("exposes usable fixtures and mocks", () => {
    expect(makeOnComingPromo().clientEnabled).toBe(true);
    expect(makeUpcomingEventApiItem().slug).toBe(FIXTURE_EVENT_SLUG);
    expect(createMockOnComingSettingsState().promo.promoTitle).toBe(
      "On Coming Promo",
    );
  });

  it("keeps core helpers wired for smoke", () => {
    expect(ON_COMING_EVENTS_PUBLIC_PATH).toBe("/on-coming-events");
    expect(normalizeOnComingSettings(makeOnComingPromo()).clientEnabled).toBe(
      true,
    );
    expect(
      mapPublicUpcomingHubEvents([makeUpcomingEventApiItem()])[0]?.slug,
    ).toBe(FIXTURE_EVENT_SLUG);
    expect(onComingEventDetailHref(FIXTURE_EVENT_SLUG)).toBe(
      `/on-coming-events/${FIXTURE_EVENT_SLUG}`,
    );
  });
});
