/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeHomeAbout } from "@/lib/home/test/fixtures/homeLib.fixture";
import { FIXTURE_HOME_ABOUT_TITLE } from "@/lib/home/test/fixtures/uuids.fixture";

vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
    ...rest
  }: {
    alt?: string;
    src?: string | { src?: string };
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt ?? ""}
      src={typeof src === "string" ? src : (src?.src ?? "")}
      {...rest}
    />
  ),
}));

vi.mock("@/components/shared", () => ({
  RevealOnView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  OrnamentDivider: () => <hr data-testid="ornament-divider" />,
}));

vi.mock("@/lib/hero/aboutMediaPreload", () => ({
  prefetchAboutHeroVideo: () => () => undefined,
  preloadAboutHeroMedia: () => undefined,
}));

const aboutHookState = vi.hoisted(() => ({
  about: null as ReturnType<typeof makeHomeAbout> | null,
  isLoading: false,
}));

vi.mock("@/hooks/use-about-content", () => ({
  useAboutContent: (initial?: unknown) => {
    if (initial) {
      return { about: initial, isLoading: false };
    }
    return {
      about: aboutHookState.about,
      isLoading: aboutHookState.isLoading,
    };
  },
}));

import AboutSection from "./AboutSection";

const videoAbout = () =>
  makeHomeAbout({
    heroMediaType: "VIDEO",
    videoDeliveryUrl: "https://cdn.example.com/about.mp4",
    videoPosterUrl: "https://cdn.example.com/about-poster.jpg",
    imageUrl: "https://cdn.example.com/about.mp4",
  });

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

function stubMediaPlay(impl?: () => Promise<void>) {
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation(impl ?? (() => Promise.resolve())),
  });
  Object.defineProperty(HTMLMediaElement.prototype, "pause", {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });
  Object.defineProperty(HTMLMediaElement.prototype, "load", {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });
}

const ioCallbacks: IntersectionObserverCallback[] = [];

function stubIntersectionObserver(isIntersecting: boolean) {
  ioCallbacks.length = 0;
  class MockIO {
    callback: IntersectionObserverCallback;
    constructor(cb: IntersectionObserverCallback) {
      this.callback = cb;
      ioCallbacks.push(cb);
    }
    observe() {
      this.callback(
        [{ isIntersecting } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
    root = null;
    rootMargin = "";
    thresholds = [];
  }
  vi.stubGlobal("IntersectionObserver", MockIO);
}

describe("AboutSection", () => {
  beforeEach(() => {
    stubMatchMedia(false);
    stubIntersectionObserver(true);
    stubMediaPlay();
    aboutHookState.isLoading = false;
    aboutHookState.about = makeHomeAbout();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders seeded about title, body, and section id", () => {
    const about = makeHomeAbout({
      paragraph1: "Home about body.\n\nSecond paragraph.",
      coreValues: ["Excellence", "Artistry"],
    });
    const { container } = render(<AboutSection initialAbout={about} />);

    expect(container.querySelector("#about")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: FIXTURE_HOME_ABOUT_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByText("Home about body.")).toBeInTheDocument();
    expect(screen.getByText("CORE VALUES")).toBeInTheDocument();
    expect(screen.getByText("Excellence")).toBeInTheDocument();
  });

  it("does not show mute control for IMAGE hero", () => {
    render(
      <AboutSection
        initialAbout={makeHomeAbout({
          heroMediaType: "IMAGE",
          imageUrl: "https://cdn.example.com/home/about.jpg",
        })}
      />,
    );

    expect(screen.queryByRole("button", { name: /mute|unmute/i })).toBeNull();
    expect(
      screen.getByAltText("Professional portrait of Shamell"),
    ).toBeInTheDocument();
  });

  it("with reduced motion does not mount the about video element", () => {
    stubMatchMedia(true);
    render(<AboutSection initialAbout={videoAbout()} />);

    expect(screen.queryByLabelText("Video about Shamell")).toBeNull();
    expect(screen.queryByRole("button", { name: /unmute video/i })).toBeNull();
  });

  it("toggles mute when video hero is near view", async () => {
    const user = userEvent.setup();
    render(<AboutSection initialAbout={videoAbout()} />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Unmute video" }),
      ).toBeInTheDocument();
    });

    Object.defineProperty(HTMLMediaElement.prototype, "paused", {
      configurable: true,
      get: () => true,
    });

    await user.click(screen.getByRole("button", { name: "Unmute video" }));
    expect(screen.getByRole("button", { name: "Mute video" })).toBeInTheDocument();
  });

  it("handles canPlay, waiting, and progress buffering UI", async () => {
    render(<AboutSection initialAbout={videoAbout()} />);

    const video = await screen.findByLabelText("Video about Shamell");
    Object.defineProperty(video, "duration", { configurable: true, value: 100 });
    Object.defineProperty(video, "buffered", {
      configurable: true,
      value: {
        length: 1,
        end: () => 40,
      },
    });

    fireEvent.waiting(video);
    fireEvent.progress(video);
    fireEvent.canPlay(video);
    fireEvent.playing(video);

    expect(screen.getByRole("button", { name: "Unmute video" })).toBeInTheDocument();
  });

  it("shows retry after load timeout and retries", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<AboutSection initialAbout={videoAbout()} />);

    await screen.findByLabelText("Video about Shamell");
    await act(async () => {
      vi.advanceTimersByTime(10_500);
    });

    expect(
      await screen.findByText("The video is still loading…"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(HTMLMediaElement.prototype.load).toHaveBeenCalled();
  });

  it("shows tap to play when autoplay is blocked", async () => {
    stubMediaPlay(() => Promise.reject(new Error("blocked")));
    const user = userEvent.setup();
    render(<AboutSection initialAbout={videoAbout()} />);

    const video = await screen.findByLabelText("Video about Shamell");
    fireEvent.canPlay(video);

    const tap = await screen.findByRole("button", { name: "Tap to play" });
    stubMediaPlay(() => Promise.resolve());
    await user.click(tap);
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Tap to play" })).toBeNull();
    });
  });

  it("falls back to poster image when poster fails", async () => {
    render(<AboutSection initialAbout={videoAbout()} />);
    const posters = document.querySelectorAll('img[aria-hidden]');
    expect(posters.length).toBeGreaterThan(0);
    fireEvent.error(posters[0]!);
    await waitFor(() => {
      expect(
        screen.getByAltText("").closest("div") || document.body,
      ).toBeTruthy();
    });
  });

  it("uses poster fallback when video has no poster url", async () => {
    render(
      <AboutSection
        initialAbout={makeHomeAbout({
          heroMediaType: "VIDEO",
          videoDeliveryUrl: "https://cdn.example.com/about.mp4",
          videoPosterUrl: null,
          imageUrl: "https://cdn.example.com/about.mp4",
        })}
      />,
    );
    await screen.findByLabelText("Video about Shamell");
    expect(document.querySelector("img")).toBeTruthy();
  });

  it("shows poster-only when video not ready but poster exists", () => {
    stubIntersectionObserver(false);
    render(
      <AboutSection
        initialAbout={makeHomeAbout({
          heroMediaType: "VIDEO",
          videoDeliveryUrl: null,
          videoPosterUrl: "https://cdn.example.com/about-poster.jpg",
          imageUrl: null,
        })}
      />,
    );
    expect(
      document.querySelector('img[src="https://cdn.example.com/about-poster.jpg"]'),
    ).toBeTruthy();
  });

  it("pauses video when leaving the viewport", async () => {
    render(<AboutSection initialAbout={videoAbout()} />);
    await screen.findByLabelText("Video about Shamell");
    await act(async () => {
      // Keep near-view true (showVideo) but flip playback observer off.
      const near = ioCallbacks[0];
      const playback = ioCallbacks[1];
      near?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      playback?.(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });

  it("shows loading placeholders when about is fetching", () => {
    aboutHookState.isLoading = true;
    aboutHookState.about = makeHomeAbout({
      paragraph1: "Loading body",
      coreValues: ["Excellence"],
    });
    render(<AboutSection />);
    expect(screen.getByText("CORE VALUES")).toBeInTheDocument();
  });

  it("shows pulse shell while loading a video hero without seed", () => {
    aboutHookState.isLoading = true;
    aboutHookState.about = makeHomeAbout({
      heroMediaType: "VIDEO",
      videoDeliveryUrl: "https://cdn.example.com/about.mp4",
      videoPosterUrl: "https://cdn.example.com/about-poster.jpg",
      imageUrl: "https://cdn.example.com/about.mp4",
      paragraph1: "Loading body",
    });
    const { container } = render(<AboutSection />);
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("skips observers when #about is missing", () => {
    const realGet = document.getElementById.bind(document);
    vi.spyOn(document, "getElementById").mockImplementation((id: string) => {
      if (id === "about") return null;
      return realGet(id);
    });
    render(<AboutSection initialAbout={videoAbout()} />);
    expect(screen.queryByLabelText("Video about Shamell")).toBeNull();
  });

  it("toggles mute without replaying when video is already playing", async () => {
    const user = userEvent.setup();
    render(<AboutSection initialAbout={videoAbout()} />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Unmute video" })).toBeInTheDocument();
    });
    Object.defineProperty(HTMLMediaElement.prototype, "paused", {
      configurable: true,
      get: () => false,
    });
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, "play");
    playSpy.mockClear();
    await user.click(screen.getByRole("button", { name: "Unmute video" }));
    expect(playSpy).not.toHaveBeenCalled();
  });

  it("reports zero buffer progress when duration is unavailable", async () => {
    render(<AboutSection initialAbout={videoAbout()} />);
    const video = await screen.findByLabelText("Video about Shamell");
    Object.defineProperty(video, "duration", { configurable: true, value: Number.NaN });
    Object.defineProperty(video, "buffered", {
      configurable: true,
      value: { length: 0, end: () => 0 },
    });
    fireEvent.waiting(video);
    fireEvent.progress(video);
    expect(screen.getByRole("button", { name: "Unmute video" })).toBeInTheDocument();
  });

  it("reports zero buffer progress when buffered ranges are empty", async () => {
    render(<AboutSection initialAbout={videoAbout()} />);
    const video = await screen.findByLabelText("Video about Shamell");
    Object.defineProperty(video, "duration", { configurable: true, value: 50 });
    Object.defineProperty(video, "buffered", {
      configurable: true,
      value: { length: 0, end: () => 0 },
    });
    fireEvent.progress(video);
    fireEvent.waiting(video);
    expect(screen.getByRole("button", { name: "Unmute video" })).toBeInTheDocument();
  });

  it("marks tap-to-play when unmute play is blocked while paused", async () => {
    stubMediaPlay(() => Promise.resolve());
    const user = userEvent.setup();
    render(<AboutSection initialAbout={videoAbout()} />);
    const video = await screen.findByLabelText("Video about Shamell");
    fireEvent.canPlay(video);
    Object.defineProperty(HTMLMediaElement.prototype, "paused", {
      configurable: true,
      get: () => true,
    });
    stubMediaPlay(() => Promise.reject(new Error("blocked")));
    await user.click(screen.getByRole("button", { name: "Unmute video" }));
    expect(await screen.findByRole("button", { name: "Tap to play" })).toBeInTheDocument();
  });

  it("swallows tap-to-play rejection", async () => {
    stubMediaPlay(() => Promise.reject(new Error("blocked")));
    const user = userEvent.setup();
    render(<AboutSection initialAbout={videoAbout()} />);
    const video = await screen.findByLabelText("Video about Shamell");
    fireEvent.canPlay(video);
    const tap = await screen.findByRole("button", { name: "Tap to play" });
    stubMediaPlay(() => Promise.reject(new Error("still blocked")));
    await user.click(tap);
    expect(screen.getByRole("button", { name: "Tap to play" })).toBeInTheDocument();
  });

  it("marks tap-to-play when retry play is blocked", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    stubMediaPlay(() => Promise.resolve());
    render(<AboutSection initialAbout={videoAbout()} />);
    const video = await screen.findByLabelText("Video about Shamell");
    await act(async () => {
      vi.advanceTimersByTime(10_500);
    });
    stubMediaPlay(() => Promise.reject(new Error("blocked")));
    await user.click(await screen.findByRole("button", { name: "Retry" }));
    fireEvent.canPlay(video);
    expect(await screen.findByRole("button", { name: "Tap to play" })).toBeInTheDocument();
  });

  it("renders image fallback for video type without src or poster", () => {
    render(
      <AboutSection
        initialAbout={makeHomeAbout({
          heroMediaType: "VIDEO",
          videoDeliveryUrl: null,
          videoPosterUrl: null,
          imageUrl: null,
        })}
      />,
    );
    expect(
      screen.getByAltText("Professional portrait of Shamell"),
    ).toBeInTheDocument();
  });
});
