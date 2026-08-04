/** @vitest-environment jsdom */

import { afterEach, describe, expect, it } from "vitest";
import {
  makeAboutHeroContent,
  makeAboutHeroVideoContent,
} from "./test/fixtures/heroLib.fixture";
import {
  FIXTURE_ABOUT_POSTER,
  FIXTURE_ABOUT_VIDEO,
} from "./test/fixtures/uuids.fixture";
import {
  aboutHeroPreloadUrls,
  prefetchAboutHeroVideo,
  preloadAboutHeroMedia,
} from "./aboutMediaPreload";

describe("aboutHeroPreloadUrls", () => {
  it("returns nulls for image heroes", () => {
    expect(aboutHeroPreloadUrls(makeAboutHeroContent())).toEqual({
      poster: null,
      video: null,
    });
  });

  it("returns poster and video for video heroes", () => {
    expect(aboutHeroPreloadUrls(makeAboutHeroVideoContent())).toEqual({
      poster: FIXTURE_ABOUT_POSTER,
      video: FIXTURE_ABOUT_VIDEO,
    });
  });
});

describe("preloadAboutHeroMedia / prefetchAboutHeroVideo", () => {
  afterEach(() => {
    document.head.querySelectorAll("link[rel='preload'], link[rel='prefetch']").forEach((n) =>
      n.remove(),
    );
  });

  it("injects a high-priority poster preload and cleans up", () => {
    const cleanup = preloadAboutHeroMedia(makeAboutHeroVideoContent());
    const link = document.head.querySelector(
      `link[rel="preload"][href="${FIXTURE_ABOUT_POSTER}"]`,
    );
    expect(link).toBeTruthy();
    expect(link?.getAttribute("fetchpriority")).toBe("high");
    cleanup();
    expect(
      document.head.querySelector(
        `link[rel="preload"][href="${FIXTURE_ABOUT_POSTER}"]`,
      ),
    ).toBeNull();
  });

  it("no-ops when there is no poster", () => {
    const cleanup = preloadAboutHeroMedia(makeAboutHeroContent());
    expect(document.head.querySelectorAll("link[rel='preload']")).toHaveLength(
      0,
    );
    cleanup();
  });

  it("prefeches video when connection allows", () => {
    const cleanup = prefetchAboutHeroVideo(FIXTURE_ABOUT_VIDEO);
    const link = document.head.querySelector(
      `link[rel="prefetch"][href="${FIXTURE_ABOUT_VIDEO}"]`,
    ) as HTMLLinkElement | null;
    expect(link).toBeTruthy();
    expect(link?.as).toBe("video");
    cleanup();
  });

  it("skips prefetch on empty url", () => {
    const cleanup = prefetchAboutHeroVideo("  ");
    expect(document.head.querySelectorAll("link[rel='prefetch']")).toHaveLength(
      0,
    );
    cleanup();
  });
});
