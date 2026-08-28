/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { makeHomeOnComingSettings } from "@/lib/home/test/fixtures/homeLib.fixture";
import type { OnComingEventHubCardItem } from "@/features/on-coming-events/components/OnComingEventHubCard";

const settingsState = {
  clientEnabled: true,
  promo: makeHomeOnComingSettings(),
  isLoading: false,
};

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/shared", () => ({
  RevealOnView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  CatalogCardCarousel: ({
    children,
    ariaLabel,
  }: {
    children: React.ReactNode;
    ariaLabel?: string;
  }) => <div aria-label={ariaLabel}>{children}</div>,
}));

vi.mock("@/hooks/use-on-coming-events-settings", () => ({
  useOnComingEventsSettings: () => ({
    clientEnabled: settingsState.clientEnabled,
    promo: settingsState.promo,
    isLoading: settingsState.isLoading,
    reload: vi.fn(),
  }),
}));

vi.mock("@/features/on-coming-events/components/OnComingEventHubCard", () => ({
  OnComingEventHubCard: ({
    event,
  }: {
    event: OnComingEventHubCardItem;
  }) => <div data-testid={`hub-card-${event.slug}`}>{event.eventTypeName}</div>,
}));

import OnComingEventsPromoSection from "./OnComingEventsPromoSection";

const seededEvent: OnComingEventHubCardItem = {
  slug: "gala-night",
  eventTypeName: "Gala Night",
  heroImageUrl: "https://cdn.example.com/home/event.jpg",
  heroMediaType: "IMAGE",
  purchaseMode: "fixed_ticket",
  purchasable: true,
};

describe("OnComingEventsPromoSection", () => {
  afterEach(() => {
    cleanup();
    settingsState.clientEnabled = true;
    settingsState.isLoading = false;
    settingsState.promo = makeHomeOnComingSettings();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns null when clientEnabled is false", () => {
    settingsState.clientEnabled = false;
    const { container } = render(
      <OnComingEventsPromoSection
        initialSettings={makeHomeOnComingSettings({ clientEnabled: false })}
        initialEvents={[seededEvent]}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders promo title, seeded cards, and View all link", () => {
    settingsState.clientEnabled = true;
    settingsState.promo = makeHomeOnComingSettings({
      promoTitle: "Home Promo",
      promoDescription: "Promo copy",
    });

    const { container } = render(
      <OnComingEventsPromoSection
        initialSettings={makeHomeOnComingSettings()}
        initialEvents={[seededEvent]}
      />,
    );

    expect(container.querySelector("#on-coming-events")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Home Promo" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Promo copy")).toBeInTheDocument();
    expect(screen.getByTestId("hub-card-gala-night")).toHaveTextContent(
      "Gala Night",
    );
    expect(screen.getByRole("link", { name: "View all events" })).toHaveAttribute(
      "href",
      "/on-coming-events",
    );
  });

  it("loads events from fetch when not seeded", async () => {
    settingsState.clientEnabled = true;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: "550e8400-e29b-41d4-a716-446655440088",
            slug: "fetched-night",
            eventTypeName: "Fetched Night",
            description: "From API",
            items: ["Show"],
            purchaseMode: "fixed_ticket",
            purchasable: true,
            heroImageUrl: "https://cdn.example.com/fetched.jpg",
          },
        ],
      }),
    );

    render(
      <OnComingEventsPromoSection
        initialSettings={makeHomeOnComingSettings()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("hub-card-fetched-night")).toHaveTextContent(
        "Fetched Night",
      );
    });
  });

  it("shows empty state after failed fetch without seed", async () => {
    settingsState.clientEnabled = true;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    render(
      <OnComingEventsPromoSection
        initialSettings={makeHomeOnComingSettings()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Upcoming events coming soon."),
      ).toBeInTheDocument();
    });
  });

  it("refreshes seeded events on window focus", async () => {
    settingsState.clientEnabled = true;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "550e8400-e29b-41d4-a716-446655440099",
          slug: "refreshed-gala",
          eventTypeName: "Refreshed Gala",
          description: "Updated",
          items: ["Dance"],
          purchaseMode: "fixed_ticket",
          purchasable: true,
          heroImageUrl: "https://cdn.example.com/r.jpg",
        },
      ],
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <OnComingEventsPromoSection
        initialSettings={makeHomeOnComingSettings()}
        initialEvents={[seededEvent]}
      />,
    );

    expect(screen.getByTestId("hub-card-gala-night")).toBeInTheDocument();
    window.dispatchEvent(new Event("focus"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      expect(screen.getByTestId("hub-card-refreshed-gala")).toHaveTextContent(
        "Refreshed Gala",
      );
    });
  });

  it("keeps seeded events when focus refresh fails", async () => {
    settingsState.clientEnabled = true;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("offline")),
    );

    render(
      <OnComingEventsPromoSection
        initialSettings={makeHomeOnComingSettings()}
        initialEvents={[seededEvent]}
      />,
    );

    window.dispatchEvent(new Event("focus"));
    await waitFor(() => {
      expect(screen.getByTestId("hub-card-gala-night")).toBeInTheDocument();
    });
  });

  it("returns null while settings are loading", () => {
    settingsState.isLoading = true;
    const { container } = render(
      <OnComingEventsPromoSection
        initialSettings={makeHomeOnComingSettings()}
        initialEvents={[seededEvent]}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("uses default title/description when promo fields are empty", () => {
    settingsState.clientEnabled = true;
    settingsState.promo = makeHomeOnComingSettings({
      promoTitle: "   ",
      promoDescription: null,
    });

    render(
      <OnComingEventsPromoSection
        initialSettings={makeHomeOnComingSettings()}
        initialEvents={[seededEvent]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "On Coming Events" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Discover on coming experiences/i),
    ).toBeInTheDocument();
  });

  it("clears events when clientEnabled becomes false during effect", async () => {
    settingsState.clientEnabled = false;
    render(
      <OnComingEventsPromoSection
        initialSettings={makeHomeOnComingSettings({ clientEnabled: false })}
        initialEvents={[seededEvent]}
      />,
    );
    expect(document.body.textContent).not.toContain("Gala Night");
  });

  it("keeps seed when focus refresh returns non-ok", async () => {
    settingsState.clientEnabled = true;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => [{ slug: "should-not-appear" }],
      }),
    );

    render(
      <OnComingEventsPromoSection
        initialSettings={makeHomeOnComingSettings()}
        initialEvents={[seededEvent]}
      />,
    );
    window.dispatchEvent(new Event("focus"));
    await waitFor(() => {
      expect(screen.getByTestId("hub-card-gala-night")).toBeInTheDocument();
    });
  });

  it("treats non-ok unseeded fetch as empty list", async () => {
    settingsState.clientEnabled = true;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => [{ slug: "nope" }],
      }),
    );

    render(
      <OnComingEventsPromoSection
        initialSettings={makeHomeOnComingSettings()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Upcoming events coming soon."),
      ).toBeInTheDocument();
    });
  });

  it("ignores unseeded fetch after unmount", async () => {
    settingsState.clientEnabled = true;
    let resolveFetch!: (value: {
      ok: boolean;
      json: () => Promise<unknown>;
    }) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
      ),
    );

    const { unmount } = render(
      <OnComingEventsPromoSection
        initialSettings={makeHomeOnComingSettings()}
      />,
    );
    unmount();
    resolveFetch({
      ok: true,
      json: async () => [
        {
          id: "550e8400-e29b-41d4-a716-446655440088",
          slug: "late",
          eventTypeName: "Late",
          description: "Late",
          items: ["Show"],
          purchaseMode: "fixed_ticket",
          purchasable: true,
        },
      ],
    });
    await Promise.resolve();
    expect(screen.queryByTestId("hub-card-late")).toBeNull();
  });

  it("ignores focus refresh after unmount", async () => {
    settingsState.clientEnabled = true;
    let resolveFetch!: (value: {
      ok: boolean;
      json: () => Promise<unknown>;
    }) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
      ),
    );

    const { unmount } = render(
      <OnComingEventsPromoSection
        initialSettings={makeHomeOnComingSettings()}
        initialEvents={[seededEvent]}
      />,
    );
    window.dispatchEvent(new Event("focus"));
    unmount();
    resolveFetch({
      ok: true,
      json: async () => [
        {
          id: "550e8400-e29b-41d4-a716-446655440099",
          slug: "late-seed",
          eventTypeName: "Late Seed",
          description: "Updated",
          items: ["Dance"],
          purchaseMode: "fixed_ticket",
          purchasable: true,
        },
      ],
    });
    await Promise.resolve();
    expect(screen.queryByTestId("hub-card-late-seed")).toBeNull();
  });

  it("ignores rejected unseeded fetch after unmount", async () => {
    settingsState.clientEnabled = true;
    let rejectFetch!: (reason?: unknown) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        new Promise((_, reject) => {
          rejectFetch = reject;
        }),
      ),
    );

    const { unmount } = render(
      <OnComingEventsPromoSection
        initialSettings={makeHomeOnComingSettings()}
      />,
    );
    unmount();
    rejectFetch(new Error("gone"));
    await Promise.resolve();
    expect(screen.queryByText("Upcoming events coming soon.")).toBeNull();
  });
});
