import { vi } from "vitest";
import {
  makeAboutContentItem,
  makeAboutVideoContentItem,
} from "../fixtures/aboutLib.fixture";
import { FIXTURE_ABOUT_TITLE } from "../fixtures/uuids.fixture";

export function createMockAboutContentState(
  overrides: Record<string, unknown> = {},
) {
  return {
    about: makeAboutContentItem(),
    title: FIXTURE_ABOUT_TITLE,
    isLoading: false,
    ...overrides,
  };
}

export function createMockAboutVideoState(
  overrides: Record<string, unknown> = {},
) {
  return {
    about: makeAboutVideoContentItem(),
    isLoading: false,
    ...overrides,
  };
}

export function createMockFetchPublicAbout(
  resolved = makeAboutContentItem(),
) {
  return vi.fn().mockResolvedValue(resolved);
}
