import { vi } from "vitest";
import {
  makeHomeAbout,
  makeHomeAboveFoldApiPayload,
  makeHomeHeaderPhoto,
  makeHomeHeaderText,
  makeHomeOnComingSettings,
} from "../fixtures/homeLib.fixture";

export function createMockHomeAboveFoldState(
  overrides: Record<string, unknown> = {},
) {
  return {
    about: makeHomeAbout(),
    headerPhotos: [makeHomeHeaderPhoto()],
    headerText: makeHomeHeaderText(),
    onComingSettings: makeHomeOnComingSettings(),
    upcomingEvents: [],
    reload: vi.fn(),
    ...overrides,
  };
}

export function createMockHomeAboveFoldPayload(
  overrides: Record<string, unknown> = {},
) {
  return makeHomeAboveFoldApiPayload(overrides);
}
