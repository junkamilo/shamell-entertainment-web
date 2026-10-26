import {
  makeExperienceFixture,
  makeVideoExperienceFixture,
} from "@test/lib/services/support/fixtures/servicesLib.fixture";
import {
  FIXTURE_CATALOG_PRICE,
  FIXTURE_EXPERIENCE_SLUG,
} from "@test/lib/services/support/fixtures/uuids.fixture";

export function createMockServicesCatalogState(
  overrides: Record<string, unknown> = {},
) {
  return {
    slug: FIXTURE_EXPERIENCE_SLUG,
    price: FIXTURE_CATALOG_PRICE,
    experiences: [makeExperienceFixture(), makeVideoExperienceFixture()],
    currencySuffix: "USD",
    ...overrides,
  };
}
