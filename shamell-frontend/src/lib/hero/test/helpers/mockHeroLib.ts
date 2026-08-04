import { vi } from "vitest";
import {
  makeAboutHeroContent,
  makeAboutHeroVideoContent,
  makeHeroHeaderPhoto,
} from "../fixtures/heroLib.fixture";

export function createMockHeroAboutState(
  overrides: Record<string, unknown> = {},
) {
  return {
    about: makeAboutHeroContent(),
    videoAbout: makeAboutHeroVideoContent(),
    cleanup: vi.fn(),
    ...overrides,
  };
}

export function createMockHeroLcpState(
  overrides: Record<string, unknown> = {},
) {
  return {
    firstSlide: makeHeroHeaderPhoto(),
    ...overrides,
  };
}
