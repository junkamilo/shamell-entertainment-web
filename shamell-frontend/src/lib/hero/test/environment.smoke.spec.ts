/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import {
  makeAboutHeroVideoContent,
  makeHeroHeaderPhoto,
} from "./fixtures/heroLib.fixture";
import { FIXTURE_ABOUT_POSTER } from "./fixtures/uuids.fixture";
import { createMockHeroAboutState } from "./helpers/mockHeroLib";
import { ABOUT_HERO_VIDEO_ASPECT } from "../aboutHeroLayout";
import { aboutHeroPreloadUrls } from "../aboutMediaPreload";
import { inferAboutHeroIsVideo } from "../aboutHeroMedia";
import { heroLcpPreload } from "../heroMediaPreload";
import { heroWaveEdgeYNorm } from "../heroPearlWave";

describe("hero lib test environment", () => {
  it("exposes usable fixtures and mocks", () => {
    expect(createMockHeroAboutState().videoAbout.heroMediaType).toBe("VIDEO");
    expect(makeHeroHeaderPhoto().mediaType).toBe("IMAGE");
    expect(ABOUT_HERO_VIDEO_ASPECT).toBeCloseTo(9 / 16);
  });

  it("keeps core helpers wired for smoke", () => {
    expect(inferAboutHeroIsVideo({ heroMediaType: "VIDEO" })).toBe(true);
    expect(aboutHeroPreloadUrls(makeAboutHeroVideoContent()).poster).toBe(
      FIXTURE_ABOUT_POSTER,
    );
    expect(heroLcpPreload(makeHeroHeaderPhoto())?.options.fetchPriority).toBe(
      "high",
    );
    expect(heroWaveEdgeYNorm(0)).toBe(1);
    expect(heroWaveEdgeYNorm(1)).toBe(1);
  });
});
