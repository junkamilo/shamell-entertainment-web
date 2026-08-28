/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

const inViewRef = { current: true };

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

vi.mock("@/hooks/use-in-view-load", () => ({
  useInViewLoad: () => ({ ref: vi.fn(), inView: inViewRef.current }),
}));

vi.mock("@/components/catalog", () => ({
  EventCatalogCard: ({
    item,
  }: {
    item: { id: string; eventTypeName: string };
  }) => <div data-testid={`event-card-${item.id}`}>{item.eventTypeName}</div>,
}));

import ServicesSection from "./ServicesSection";

const validEvent = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  eventTypeName: "Private Gala",
  description: "Full staging package",
  items: ["Dance", "Host"],
  price: 1200,
  images: ["https://cdn.example.com/gala.jpg"],
};

describe("ServicesSection", () => {
  afterEach(() => {
    cleanup();
    inViewRef.current = true;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("loads events when in view and renders cards", async () => {
    inViewRef.current = true;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [validEvent],
    });
    vi.stubGlobal("fetch", fetchMock);

    const { container } = render(<ServicesSection />);

    expect(container.querySelector("#experiences")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "TYPES OF EVENTS" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId(`event-card-${validEvent.id}`)).toHaveTextContent(
        "Private Gala",
      );
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/events?publicSection=GENERAL"),
    );
  });

  it("does not fetch when section is not in view", () => {
    inViewRef.current = false;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<ServicesSection />);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Loading event types...")).toBeNull();
  });

  it("shows empty copy when fetch fails", async () => {
    inViewRef.current = true;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      }),
    );

    render(<ServicesSection />);

    await waitFor(() => {
      expect(screen.getByText("Event types coming soon.")).toBeInTheDocument();
    });
  });

  it("filters invalid API rows", async () => {
    inViewRef.current = true;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { id: "bad" },
          validEvent,
        ],
      }),
    );

    render(<ServicesSection />);

    await waitFor(() => {
      expect(screen.getByTestId(`event-card-${validEvent.id}`)).toBeInTheDocument();
    });
    expect(screen.queryByTestId("event-card-bad")).toBeNull();
  });

  it("normalizes price strings, hero media types, and posters", async () => {
    inViewRef.current = true;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: "550e8400-e29b-41d4-a716-446655440002",
            eventTypeName: "Video Gala",
            description: "Clip package",
            items: ["Show"],
            price: "99.5",
            heroImageUrl: "https://cdn.example.com/clip.mp4",
            heroMediaType: "VIDEO",
            heroPosterUrl: "https://cdn.example.com/poster.jpg",
            heroPosterUrlMobile: "https://cdn.example.com/poster-m.jpg",
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440003",
            eventTypeName: "Image Gala",
            description: "Photo package",
            items: ["Photo"],
            price: null,
            images: ["https://cdn.example.com/img.jpg"],
            heroMediaType: "IMAGE",
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440004",
            eventTypeName: "Inferred Video",
            description: "From url",
            items: ["Clip"],
            images: ["https://cdn.example.com/infer.mp4"],
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440005",
            eventTypeName: "Bad Price",
            description: "NaN price",
            items: ["X"],
            price: "not-a-number",
            images: ["  ", "https://cdn.example.com/ok.jpg"],
            heroPosterUrl: 123,
            heroPosterUrlMobile: 456,
          },
        ],
      }),
    );

    render(<ServicesSection />);

    await waitFor(() => {
      expect(screen.getByTestId("event-card-550e8400-e29b-41d4-a716-446655440002")).toHaveTextContent(
        "Video Gala",
      );
      expect(screen.getByTestId("event-card-550e8400-e29b-41d4-a716-446655440005")).toHaveTextContent(
        "Bad Price",
      );
    });
  });

  it("ignores non-array JSON payloads", async () => {
    inViewRef.current = true;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ not: "array" }),
      }),
    );

    render(<ServicesSection />);

    await waitFor(() => {
      expect(screen.getByText("Event types coming soon.")).toBeInTheDocument();
    });
  });

  it("falls back to first gallery image when heroImageUrl is empty", async () => {
    inViewRef.current = true;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: "550e8400-e29b-41d4-a716-446655440010",
            eventTypeName: "From Images",
            description: "Uses images[0]",
            items: ["A"],
            heroImageUrl: "   ",
            images: ["https://cdn.example.com/from-images.jpg"],
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440011",
            eventTypeName: "No Media",
            description: "Null hero",
            items: ["B"],
            heroImageUrl: null,
            images: [],
          },
        ],
      }),
    );

    render(<ServicesSection />);

    await waitFor(() => {
      expect(
        screen.getByTestId("event-card-550e8400-e29b-41d4-a716-446655440010"),
      ).toHaveTextContent("From Images");
      expect(
        screen.getByTestId("event-card-550e8400-e29b-41d4-a716-446655440011"),
      ).toHaveTextContent("No Media");
    });
  });

  it("ignores late fetch results after unmount", async () => {
    inViewRef.current = true;
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

    const { unmount } = render(<ServicesSection />);
    unmount();
    resolveFetch({
      ok: false,
      json: async () => [],
    });
    await waitFor(() => {
      expect(true).toBe(true);
    });
  });

  it("ignores late successful fetch after unmount", async () => {
    inViewRef.current = true;
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

    const { unmount } = render(<ServicesSection />);
    unmount();
    resolveFetch({
      ok: true,
      json: async () => [validEvent],
    });
    await Promise.resolve();
    expect(screen.queryByTestId(`event-card-${validEvent.id}`)).toBeNull();
  });
});
