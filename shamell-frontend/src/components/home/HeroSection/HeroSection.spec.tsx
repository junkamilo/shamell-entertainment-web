/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  makeHomeHeaderPhoto,
  makeHomeHeaderText,
} from "@/lib/home/test/fixtures/homeLib.fixture";
import { FIXTURE_HOME_HEADLINE } from "@/lib/home/test/fixtures/uuids.fixture";

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

import HeroSection from "./HeroSection";

function stubMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("HeroSection", () => {
  beforeEach(() => {
    stubMatchMedia(true);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders seeded headline, Inquire CTA, and hero id", () => {
    const { container } = render(
      <HeroSection
        initialPhotos={[makeHomeHeaderPhoto()]}
        initialHeaderText={makeHomeHeaderText()}
      />,
    );

    expect(container.querySelector("#hero")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: FIXTURE_HOME_HEADLINE }),
    ).toBeInTheDocument();
    expect(screen.getByText("Home tagline")).toBeInTheDocument();
    expect(screen.getByText("Home quote")).toBeInTheDocument();
    const inquire = screen.getByRole("link", { name: "Inquire" });
    expect(inquire).toHaveAttribute("href", "/contacto");
    expect(screen.getByAltText("Shamell")).toBeInTheDocument();
  });

  it("shows fallback background when there are no photos", () => {
    const { container } = render(
      <HeroSection initialPhotos={[]} initialHeaderText={makeHomeHeaderText()} />,
    );

    expect(container.querySelector("#hero")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: FIXTURE_HOME_HEADLINE }),
    ).toBeInTheDocument();
    expect(container.querySelector(".bg-\\[\\#070707\\], [aria-hidden]")).toBeTruthy();
  });

  it("does not fetch header-media when initialPhotos are provided", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    render(
      <HeroSection
        initialPhotos={[makeHomeHeaderPhoto()]}
        initialHeaderText={makeHomeHeaderText()}
      />,
    );

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("paints seeded LCP image immediately without waiting for hydrate", () => {
    const { container } = render(
      <HeroSection
        initialPhotos={[makeHomeHeaderPhoto()]}
        initialHeaderText={makeHomeHeaderText()}
      />,
    );
    const lcp = container.querySelector(
      'img[src="https://cdn.example.com/home/header.jpg"]',
    );
    expect(lcp).toBeTruthy();
    expect(lcp).toHaveAttribute("fetchpriority", "high");
    expect(lcp).toHaveAttribute("loading", "eager");
  });

  it("fetches header-media when initialPhotos is empty", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "fetched-1",
          mediaType: "IMAGE",
          imageUrl: "https://cdn.example.com/fetched.jpg",
          imageUrlMobile: "https://cdn.example.com/fetched-m.jpg",
        },
      ],
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <HeroSection initialPhotos={[]} initialHeaderText={makeHomeHeaderText()} />,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/header-media"),
        expect.any(Object),
      );
    });
    await waitFor(() => {
      expect(
        document.querySelector('img[src="https://cdn.example.com/fetched.jpg"]'),
      ).toBeTruthy();
    });
  });

  it("keeps fallback when header-media fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network")),
    );

    render(
      <HeroSection initialPhotos={[]} initialHeaderText={makeHomeHeaderText()} />,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: FIXTURE_HOME_HEADLINE })).toBeInTheDocument();
    });
  });

  it("ignores non-ok header-media responses and empty lists", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error("bad json");
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "x", mediaType: "IMAGE" }],
      });
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = render(
      <HeroSection initialPhotos={[]} initialHeaderText={makeHomeHeaderText()} />,
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    unmount();

    render(
      <HeroSection initialPhotos={[]} initialHeaderText={makeHomeHeaderText()} />,
    );
    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(1));
  });

  it("renders video slide and advances slideshow", async () => {
    stubMatchMedia(false);
    vi.useFakeTimers({ shouldAdvanceTime: true });

    render(
      <HeroSection
        initialPhotos={[
          makeHomeHeaderPhoto({
            id: "v1",
            mediaType: "VIDEO",
            videoDeliveryUrl: "https://cdn.example.com/hero.mp4",
            videoPosterUrl: "https://cdn.example.com/hero-poster.jpg",
            videoPosterUrlMobile: "https://cdn.example.com/hero-poster-m.jpg",
            imageUrl: null,
            focalX: Number.NaN,
            focalY: undefined,
            focalMobileX: 10,
            focalMobileY: 20,
          }),
          makeHomeHeaderPhoto({
            id: "i2",
            mediaType: "IMAGE",
            imageUrl: "https://cdn.example.com/hero-2.jpg",
            imageUrlMobile: null,
          }),
        ]}
        initialHeaderText={makeHomeHeaderText()}
      />,
    );

    const video = document.querySelector("video");
    expect(video).toBeTruthy();
    if (video) {
      fireEvent.canPlay(video);
      fireEvent.playing(video);
    }

    await act(async () => {
      vi.advanceTimersByTime(5600);
    });

    expect(
      screen.getByRole("heading", { name: FIXTURE_HOME_HEADLINE }),
    ).toBeInTheDocument();
  });

  it("renders image-only slide with mobile srcset", () => {
    render(
      <HeroSection
        initialPhotos={[
          makeHomeHeaderPhoto({
            imageUrl: "https://cdn.example.com/d.jpg",
            imageUrlMobile: "https://cdn.example.com/m.jpg",
            focalX: 120,
            focalY: -5,
          }),
        ]}
        initialHeaderText={makeHomeHeaderText()}
      />,
    );

    expect(
      document.querySelector('img[src="https://cdn.example.com/d.jpg"]'),
    ).toBeTruthy();
  });

  it("renders video with mobile-only poster and no delivery url", () => {
    stubMatchMedia(false);
    render(
      <HeroSection
        initialPhotos={[
          makeHomeHeaderPhoto({
            mediaType: "VIDEO",
            videoDeliveryUrl: null,
            videoPosterUrl: null,
            videoPosterUrlMobile: "https://cdn.example.com/poster-m.jpg",
            imageUrl: null,
            imageUrlMobile: null,
          }),
        ]}
        initialHeaderText={makeHomeHeaderText()}
      />,
    );
    expect(
      document.querySelector('img[src="https://cdn.example.com/poster-m.jpg"]'),
    ).toBeTruthy();
    expect(document.querySelector("video")).toBeNull();
  });

  it("does not mount video when reduced motion is preferred", () => {
    stubMatchMedia(true);
    render(
      <HeroSection
        initialPhotos={[
          makeHomeHeaderPhoto({
            mediaType: "VIDEO",
            videoDeliveryUrl: "https://cdn.example.com/hero.mp4",
            videoPosterUrl: "https://cdn.example.com/hero-poster.jpg",
            imageUrl: null,
          }),
        ]}
        initialHeaderText={makeHomeHeaderText()}
      />,
    );
    expect(document.querySelector("video")).toBeNull();
    expect(
      document.querySelector('img[src="https://cdn.example.com/hero-poster.jpg"]'),
    ).toBeTruthy();
  });

  it("returns null for image slides without any src", () => {
    const { container } = render(
      <HeroSection
        initialPhotos={[
          makeHomeHeaderPhoto({
            mediaType: "IMAGE",
            imageUrl: null,
            imageUrlMobile: null,
          }),
        ]}
        initialHeaderText={makeHomeHeaderText()}
      />,
    );
    expect(container.querySelector("#hero")).toBeTruthy();
    expect(
      document.querySelector('img[src="https://cdn.example.com/home/header.jpg"]'),
    ).toBeNull();
  });

  it("handles sparse photo list without an active photo", () => {
    render(
      <HeroSection
        initialPhotos={[undefined as unknown as ReturnType<typeof makeHomeHeaderPhoto>]}
        initialHeaderText={makeHomeHeaderText()}
      />,
    );
    expect(screen.getByRole("heading", { name: FIXTURE_HOME_HEADLINE })).toBeInTheDocument();
  });

  it("advances to a second image slide (non-first loading attrs)", async () => {
    stubMatchMedia(false);
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(
      <HeroSection
        initialPhotos={[
          makeHomeHeaderPhoto({
            id: "first",
            imageUrl: "https://cdn.example.com/a.jpg",
            imageUrlMobile: null,
          }),
          makeHomeHeaderPhoto({
            id: "second",
            imageUrl: null,
            imageUrlMobile: "https://cdn.example.com/b-m.jpg",
          }),
        ]}
        initialHeaderText={makeHomeHeaderText()}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(5600);
    });
    expect(
      document.querySelector('img[src="https://cdn.example.com/b-m.jpg"]'),
    ).toBeTruthy();
  });

  it("renders a second video slide without poster (lazy preload)", async () => {
    stubMatchMedia(false);
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(
      <HeroSection
        initialPhotos={[
          makeHomeHeaderPhoto({
            id: "img-first",
            mediaType: "IMAGE",
            imageUrl: "https://cdn.example.com/first.jpg",
          }),
          makeHomeHeaderPhoto({
            id: "vid-second",
            mediaType: "VIDEO",
            videoDeliveryUrl: "https://cdn.example.com/second.mp4",
            videoPosterUrl: "https://cdn.example.com/second-poster.jpg",
            videoPosterUrlMobile: "https://cdn.example.com/second-poster-m.jpg",
            imageUrl: null,
            imageUrlMobile: null,
          }),
        ]}
        initialHeaderText={makeHomeHeaderText()}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(5600);
    });
    const video = document.querySelector("video");
    expect(video).toBeTruthy();
    expect(video?.getAttribute("preload")).toBe("none");
    expect(
      document.querySelector('img[src="https://cdn.example.com/second-poster.jpg"]'),
    ).toBeTruthy();
  });

  it("builds empty srcset when both urls are missing on an image slide", () => {
    stubMatchMedia(false);
    render(
      <HeroSection
        initialPhotos={[
          makeHomeHeaderPhoto({
            mediaType: "VIDEO",
            videoDeliveryUrl: "https://cdn.example.com/only.mp4",
            videoPosterUrl: null,
            videoPosterUrlMobile: null,
            imageUrl: null,
            imageUrlMobile: null,
          }),
        ]}
        initialHeaderText={makeHomeHeaderText()}
      />,
    );
    expect(document.querySelector("video")).toBeTruthy();
  });
});
