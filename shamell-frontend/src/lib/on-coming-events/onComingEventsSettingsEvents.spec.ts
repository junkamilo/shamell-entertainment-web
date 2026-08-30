/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ON_COMING_EVENTS_PUBLIC_DATA_CHANGED_EVENT,
  ON_COMING_EVENTS_SETTINGS_CHANGED_EVENT,
  notifyOnComingEventsPublicDataChanged,
  notifyOnComingEventsSettingsChanged,
  subscribeOnComingEventsPublicDataChanged,
} from "./onComingEventsSettingsEvents";

describe("onComingEventsSettingsEvents", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes the public-data-changed event name", () => {
    expect(ON_COMING_EVENTS_PUBLIC_DATA_CHANGED_EVENT).toBe(
      "shamell:on-coming-events-public-data-changed",
    );
    expect(ON_COMING_EVENTS_SETTINGS_CHANGED_EVENT).toBe(
      ON_COMING_EVENTS_PUBLIC_DATA_CHANGED_EVENT,
    );
  });

  it("dispatches the event on window and triggers home revalidation", async () => {
    const spy = vi.fn();
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ ok: true })));

    window.addEventListener(ON_COMING_EVENTS_PUBLIC_DATA_CHANGED_EVENT, spy);
    notifyOnComingEventsPublicDataChanged();
    expect(spy).toHaveBeenCalledTimes(1);
    window.removeEventListener(ON_COMING_EVENTS_PUBLIC_DATA_CHANGED_EVENT, spy);

    await Promise.resolve();
    expect(fetchSpy).toHaveBeenCalledWith("/api/revalidate/home", { method: "POST" });
  });

  it("notifyOnComingEventsSettingsChanged delegates to public-data notify", () => {
    const spy = vi.fn();
    window.addEventListener(ON_COMING_EVENTS_PUBLIC_DATA_CHANGED_EVENT, spy);
    notifyOnComingEventsSettingsChanged();
    expect(spy).toHaveBeenCalledTimes(1);
    window.removeEventListener(ON_COMING_EVENTS_PUBLIC_DATA_CHANGED_EVENT, spy);
  });

  it("subscribeOnComingEventsPublicDataChanged listens to window events", () => {
    const spy = vi.fn();
    const unsubscribe = subscribeOnComingEventsPublicDataChanged(spy);
    window.dispatchEvent(new Event(ON_COMING_EVENTS_PUBLIC_DATA_CHANGED_EVENT));
    expect(spy).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
