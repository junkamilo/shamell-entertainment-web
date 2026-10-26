import { vi } from "vitest";
import {
  makeHeaderTextContent,
  makePublicHeaderPhoto,
} from "@test/lib/header-media/support/fixtures/headerMediaLib.fixture";
import { FIXTURE_HEADER_HEADLINE } from "@test/lib/header-media/support/fixtures/uuids.fixture";

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
