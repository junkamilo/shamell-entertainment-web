import { vi } from "vitest";
import {
  makeHeaderTextContent,
  makePublicHeaderPhoto,
} from "../fixtures/headerMediaLib.fixture";
import { FIXTURE_HEADER_HEADLINE } from "../fixtures/uuids.fixture";

export function createMockHeaderMediaState(
  overrides: Record<string, unknown> = {},
) {
  return {
    photos: [makePublicHeaderPhoto()],
    text: makeHeaderTextContent(),
    headline: FIXTURE_HEADER_HEADLINE,
    isLoading: false,
    reload: vi.fn(),
    ...overrides,
  };
}
