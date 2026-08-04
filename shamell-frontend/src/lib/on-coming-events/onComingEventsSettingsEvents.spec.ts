/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ON_COMING_EVENTS_SETTINGS_CHANGED_EVENT,
  notifyOnComingEventsSettingsChanged,
} from "./onComingEventsSettingsEvents";

describe("onComingEventsSettingsEvents", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes the settings-changed event name", () => {
    expect(ON_COMING_EVENTS_SETTINGS_CHANGED_EVENT).toBe(
      "shamell:on-coming-events-settings-changed",
    );
  });

  it("dispatches the event on window", () => {
    const spy = vi.fn();
    window.addEventListener(ON_COMING_EVENTS_SETTINGS_CHANGED_EVENT, spy);
    notifyOnComingEventsSettingsChanged();
    expect(spy).toHaveBeenCalledTimes(1);
    window.removeEventListener(ON_COMING_EVENTS_SETTINGS_CHANGED_EVENT, spy);
  });
});
