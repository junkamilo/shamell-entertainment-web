/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { ON_COMING_EVENTS_PUBLIC_DATA_CHANGED_EVENT } from "@/lib/on-coming-events/onComingEventsSettingsEvents";
import { server } from "@/test/server";
import type { OnComingEventHubCardItem } from "@/features/on-coming-events/components/OnComingEventHubCard";
import { usePublicUpcomingHubEvents } from "./use-public-upcoming-hub-events";

const hubEvent: OnComingEventHubCardItem = {
  slug: "gala-night",
  eventTypeName: "Gala Night",
  heroImageUrl: "https://cdn.example.com/gala.jpg",
  heroMediaType: "IMAGE",
  purchaseMode: "fixed_ticket",
  purchasable: true,
};

describe("usePublicUpcomingHubEvents", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("refreshes on mount when enabled", async () => {
    server.use(
      http.get("*/api/v1/events", () =>
        HttpResponse.json([
          {
            id: "550e8400-e29b-41d4-a716-446655440088",
            slug: "fresh-night",
            eventTypeName: "Fresh Night",
            description: "Live",
            items: ["Show"],
            purchaseMode: "fixed_ticket",
            purchasable: true,
          },
        ]),
      ),
    );

    const { result } = renderHook(() =>
      usePublicUpcomingHubEvents({ initialEvents: [hubEvent], enabled: true }),
    );

    expect(result.current.events[0]?.slug).toBe("gala-night");

    await waitFor(() => {
      expect(result.current.events[0]?.slug).toBe("fresh-night");
    });
  });

  it("clears events when disabled", async () => {
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        usePublicUpcomingHubEvents({ initialEvents: [hubEvent], enabled }),
      { initialProps: { enabled: true } },
    );

    expect(result.current.events).toHaveLength(1);
    rerender({ enabled: false });
    await waitFor(() => {
      expect(result.current.events).toHaveLength(0);
    });
  });

  it("reloads when public-data-changed fires", async () => {
    server.use(
      http.get("*/api/v1/events", () =>
        HttpResponse.json([
          {
            id: "550e8400-e29b-41d4-a716-446655440099",
            slug: "signal-night",
            eventTypeName: "Signal Night",
            description: "Live",
            items: ["Show"],
            purchaseMode: "fixed_ticket",
            purchasable: true,
          },
        ]),
      ),
    );

    const { result } = renderHook(() =>
      usePublicUpcomingHubEvents({ initialEvents: [], enabled: true }),
    );

    await waitFor(() => {
      expect(result.current.events[0]?.slug).toBe("signal-night");
    });

    server.use(
      http.get("*/api/v1/events", () =>
        HttpResponse.json([
          {
            id: "550e8400-e29b-41d4-a716-446655440077",
            slug: "updated-night",
            eventTypeName: "Updated Night",
            description: "Live",
            items: ["Show"],
            purchaseMode: "fixed_ticket",
            purchasable: true,
          },
        ]),
      ),
    );

    await act(async () => {
      window.dispatchEvent(new Event(ON_COMING_EVENTS_PUBLIC_DATA_CHANGED_EVENT));
    });

    await waitFor(() => {
      expect(result.current.events[0]?.slug).toBe("updated-night");
    });
  });
});
