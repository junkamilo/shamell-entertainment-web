/** @vitest-environment jsdom */

import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { defaultOnComingSettings } from "@/lib/on-coming-events/onComingSettings";
import { ON_COMING_EVENTS_SETTINGS_CHANGED_EVENT } from "@/lib/on-coming-events/onComingEventsSettingsEvents";
import { server } from "@/test/server";
import { onComingSettingsHandler } from "./test/mocks/handlers";
import { makeOnComingPromo } from "./test/fixtures/hooks.fixture";
import { useOnComingEventsSettings } from "./use-on-coming-events-settings";

describe("useOnComingEventsSettings", () => {
  beforeEach(() => {
    server.use(onComingSettingsHandler());
  });

  it("loads settings from the public API", async () => {
    const { result } = renderHook(() => useOnComingEventsSettings());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.clientEnabled).toBe(true);
    expect(result.current.promo.promoTitle).toBe("Hooks Promo");
  });

  it("skips the first fetch when initialSettings are provided", async () => {
    const initial = makeOnComingPromo({
      clientEnabled: false,
      promoTitle: "SSR Promo",
    });
    const { result } = renderHook(() => useOnComingEventsSettings(initial));
    expect(result.current.promo.promoTitle).toBe("SSR Promo");
    expect(result.current.isLoading).toBe(false);
  });

  it("reloads on the settings-changed event", async () => {
    const { result } = renderHook(() => useOnComingEventsSettings());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    server.use(
      onComingSettingsHandler(
        makeOnComingPromo({ promoTitle: "Updated Promo" }),
      ),
    );

    await act(async () => {
      window.dispatchEvent(new Event(ON_COMING_EVENTS_SETTINGS_CHANGED_EVENT));
    });

    await waitFor(() =>
      expect(result.current.promo.promoTitle).toBe("Updated Promo"),
    );
  });

  it("falls back to defaults when the API fails", async () => {
    server.use(
      http.get("*/api/v1/on-coming-events/settings", () =>
        HttpResponse.json({ message: "down" }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useOnComingEventsSettings());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.promo.clientEnabled).toBe(
      defaultOnComingSettings.clientEnabled,
    );
  });
});
