/** @vitest-environment jsdom */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { server } from "@test/support/server";
import { onComingSettingsHandler } from "@test/hooks/support/mocks/handlers";
import { clearOnComingEventsSettingsCache } from "@/hooks/use-on-coming-events-settings";
import {
  useOnComingEventsSettings,
  useVenueLayoutSettings,
} from "@/hooks/use-venue-layout-settings/use-venue-layout-settings";

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
