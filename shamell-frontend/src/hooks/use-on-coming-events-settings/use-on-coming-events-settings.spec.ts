/** @vitest-environment jsdom */

import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { defaultOnComingSettings } from "@/lib/on-coming-events/onComingSettings";
import { ON_COMING_EVENTS_SETTINGS_CHANGED_EVENT } from "@/lib/on-coming-events/onComingEventsSettingsEvents";
import { server } from "@/test/server";
import { onComingSettingsHandler } from "../test/mocks/handlers";
import { makeOnComingPromo } from "../test/fixtures/hooks.fixture";
import {
  clearOnComingEventsSettingsCache,
  useOnComingEventsSettings,
} from "./use-on-coming-events-settings";

describe("useOnComingEventsSettings", () => {
  beforeEach(() => {
    clearOnComingEventsSettingsCache();
    server.use(onComingSettingsHandler());
  });

  it("loads settings from the public API", async () => {
    const { result } = renderHook(() => useOnComingEventsSettings());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.clientEnabled).toBe(true);
    expect(result.current.promo.promoTitle).toBe("Hooks Promo");
  });

  it("skips the first fetch when initialSettings are provided", async () => {
    let hits = 0;
    server.use(
      http.get("*/api/v1/on-coming-events/settings", () => {
        hits += 1;
        return HttpResponse.json(makeOnComingPromo());
      }),
    );

    const initial = makeOnComingPromo({
      clientEnabled: false,
      promoTitle: "SSR Promo",
    });
    const { result } = renderHook(() => useOnComingEventsSettings(initial));
    expect(result.current.promo.promoTitle).toBe("SSR Promo");
    expect(result.current.isLoading).toBe(false);
    await act(async () => {
      await Promise.resolve();
    });
    expect(hits).toBe(0);
  });

  it("dedupes concurrent mounts to a single network request", async () => {
    let hits = 0;
    server.use(
      http.get("*/api/v1/on-coming-events/settings", async () => {
        hits += 1;
        await new Promise((r) => setTimeout(r, 30));
        return HttpResponse.json(
          makeOnComingPromo({ promoTitle: "Shared Promo" }),
        );
      }),
    );

    const a = renderHook(() => useOnComingEventsSettings());
    const b = renderHook(() => useOnComingEventsSettings());

    await waitFor(() => expect(a.result.current.isLoading).toBe(false));
    await waitFor(() => expect(b.result.current.isLoading).toBe(false));

    expect(hits).toBe(1);
    expect(a.result.current.promo.promoTitle).toBe("Shared Promo");
    expect(b.result.current.promo.promoTitle).toBe("Shared Promo");
  });

  it("reuses the cache on remount without another network hit", async () => {
    let hits = 0;
    server.use(
      http.get("*/api/v1/on-coming-events/settings", () => {
        hits += 1;
        return HttpResponse.json(makeOnComingPromo({ promoTitle: "Cached" }));
      }),
    );

    const first = renderHook(() => useOnComingEventsSettings());
    await waitFor(() => expect(first.result.current.isLoading).toBe(false));
    expect(hits).toBe(1);
    first.unmount();

    const second = renderHook(() => useOnComingEventsSettings());
    await waitFor(() => expect(second.result.current.isLoading).toBe(false));
    expect(hits).toBe(1);
    expect(second.result.current.promo.promoTitle).toBe("Cached");
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
