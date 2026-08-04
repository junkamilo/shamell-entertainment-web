/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ON_COMING_EVENTS_SETTINGS_CHANGED_EVENT,
  VENUE_LAYOUT_SETTINGS_CHANGED_EVENT,
  notifyOnComingEventsSettingsChanged,
  notifyVenueLayoutSettingsChanged,
} from "./venueLayoutSettingsEvents";

describe("venueLayoutSettingsEvents (deprecated re-exports)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("aliases the canonical settings event name", () => {
    expect(VENUE_LAYOUT_SETTINGS_CHANGED_EVENT).toBe(
      ON_COMING_EVENTS_SETTINGS_CHANGED_EVENT,
    );
  });

  it("aliases notifyVenueLayoutSettingsChanged to the canonical notifier", () => {
    const spy = vi.fn();
    window.addEventListener(ON_COMING_EVENTS_SETTINGS_CHANGED_EVENT, spy);
    notifyVenueLayoutSettingsChanged();
    notifyOnComingEventsSettingsChanged();
    expect(spy).toHaveBeenCalledTimes(2);
    window.removeEventListener(ON_COMING_EVENTS_SETTINGS_CHANGED_EVENT, spy);
  });
});
