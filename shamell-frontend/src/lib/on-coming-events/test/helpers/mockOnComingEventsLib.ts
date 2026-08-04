import { vi } from "vitest";
import {
  makeCatalogTableItem,
  makeOnComingPromo,
  makeUpcomingEventApiItem,
} from "../fixtures/onComingEventsLib.fixture";
import { FIXTURE_EVENT_SLUG } from "../fixtures/uuids.fixture";

export function createMockOnComingSettingsState(
  overrides: Record<string, unknown> = {},
) {
  return {
    promo: makeOnComingPromo(),
    clientEnabled: true,
    reload: vi.fn(),
    ...overrides,
  };
}

export function createMockHubMappingState(
  overrides: Record<string, unknown> = {},
) {
  return {
    apiItems: [makeUpcomingEventApiItem()],
    slug: FIXTURE_EVENT_SLUG,
    ...overrides,
  };
}

export function createMockLayoutLabelState(
  overrides: Record<string, unknown> = {},
) {
  return {
    items: [makeCatalogTableItem()],
    notify: vi.fn(),
    ...overrides,
  };
}
