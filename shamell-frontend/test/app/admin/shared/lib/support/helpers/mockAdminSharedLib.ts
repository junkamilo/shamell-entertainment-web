import {
  makeAdminSharedBackendUrl,
  makeAdminSharedToken,
  makePriceInputFixture,
  makePriceValueFixture,
} from "@test/app/admin/shared/lib/support/fixtures/adminSharedLib.fixture";

export function createMockAdminSharedLibState(
  overrides: Record<string, unknown> = {},
) {
  return {
    token: makeAdminSharedToken(),
    backendUrl: makeAdminSharedBackendUrl(),
    priceInput: makePriceInputFixture(),
    priceValue: makePriceValueFixture(),
    ...overrides,
  };
}
