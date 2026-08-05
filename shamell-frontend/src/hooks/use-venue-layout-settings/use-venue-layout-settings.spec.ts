/** @vitest-environment jsdom */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { server } from "@/test/server";
import { onComingSettingsHandler } from "../test/mocks/handlers";
import { clearOnComingEventsSettingsCache } from "../use-on-coming-events-settings";
import {
  useOnComingEventsSettings,
  useVenueLayoutSettings,
} from "./use-venue-layout-settings";

describe("use-venue-layout-settings re-exports", () => {
  beforeEach(() => {
    clearOnComingEventsSettingsCache();
    server.use(onComingSettingsHandler());
  });

  it("re-exports useOnComingEventsSettings aliases", async () => {
    expect(useVenueLayoutSettings).toBe(useOnComingEventsSettings);

    const { result } = renderHook(() => useVenueLayoutSettings());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.promo.promoTitle).toBe("Hooks Promo");
  });
});
