import { describe, expect, it } from "vitest";
import { FIXTURE_EVENT_SLUG } from "./test/fixtures/uuids.fixture";
import { ON_COMING_EVENTS_PUBLIC_PATH } from "./onComingEventsRoutes";
import {
  onComingEventClassesHref,
  onComingEventClassPackageReturnHref,
  onComingEventClassSessionReturnHref,
  onComingEventDetailHref,
  onComingEventFixedTicketReturnHref,
  onComingEventHubHref,
  onComingEventSeatsHref,
  onComingEventVenueReturnHref,
} from "./upcomingEventPublicRoutes";

describe("upcomingEventPublicRoutes", () => {
  it("builds hub, detail, classes, and seats hrefs", () => {
    expect(onComingEventHubHref()).toBe(ON_COMING_EVENTS_PUBLIC_PATH);
    expect(onComingEventDetailHref(FIXTURE_EVENT_SLUG)).toBe(
      `${ON_COMING_EVENTS_PUBLIC_PATH}/${FIXTURE_EVENT_SLUG}`,
    );
    expect(onComingEventClassesHref(FIXTURE_EVENT_SLUG)).toBe(
      `${ON_COMING_EVENTS_PUBLIC_PATH}/${FIXTURE_EVENT_SLUG}/classes`,
    );
    expect(onComingEventSeatsHref(FIXTURE_EVENT_SLUG)).toBe(
      `${ON_COMING_EVENTS_PUBLIC_PATH}/${FIXTURE_EVENT_SLUG}/seats`,
    );
  });

  it("builds Stripe return hrefs", () => {
    expect(onComingEventVenueReturnHref()).toBe(
      `${ON_COMING_EVENTS_PUBLIC_PATH}/return`,
    );
    expect(onComingEventVenueReturnHref(FIXTURE_EVENT_SLUG)).toBe(
      `${ON_COMING_EVENTS_PUBLIC_PATH}/return?event_slug=${FIXTURE_EVENT_SLUG}`,
    );
    expect(onComingEventFixedTicketReturnHref(FIXTURE_EVENT_SLUG)).toBe(
      `${ON_COMING_EVENTS_PUBLIC_PATH}/${FIXTURE_EVENT_SLUG}/return`,
    );
    expect(onComingEventClassSessionReturnHref(FIXTURE_EVENT_SLUG)).toBe(
      `${ON_COMING_EVENTS_PUBLIC_PATH}/${FIXTURE_EVENT_SLUG}/classes/return`,
    );
    expect(onComingEventClassPackageReturnHref(FIXTURE_EVENT_SLUG)).toBe(
      `${ON_COMING_EVENTS_PUBLIC_PATH}/${FIXTURE_EVENT_SLUG}/classes/package-return`,
    );
  });
});
