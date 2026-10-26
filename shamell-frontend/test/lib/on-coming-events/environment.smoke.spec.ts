/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import {
  makeOnComingPromo,
  makeUpcomingEventApiItem,
} from "@test/lib/on-coming-events/support/fixtures/onComingEventsLib.fixture";
import { FIXTURE_EVENT_SLUG } from "@test/lib/on-coming-events/support/fixtures/uuids.fixture";
import { createMockOnComingSettingsState } from "@test/lib/on-coming-events/support/helpers/mockOnComingEventsLib";
import { ON_COMING_EVENTS_PUBLIC_PATH } from "@/lib/on-coming-events/onComingEventsRoutes";
import { normalizeOnComingSettings } from "@/lib/on-coming-events/onComingSettings";
import { mapPublicUpcomingHubEvents } from "@/lib/on-coming-events/mapPublicUpcomingHubEvents";
import { onComingEventDetailHref } from "@/lib/on-coming-events/upcomingEventPublicRoutes";

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
