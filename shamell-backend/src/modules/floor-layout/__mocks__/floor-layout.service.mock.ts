export function createFloorLayoutServiceMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    getPublicFloorLayout: jest.fn(),
    getPublicFloorLayoutForClient: jest.fn(),
    getAdminFloorLayout: jest.fn(),
    getAdminPalette: jest.fn(),
    upsertAdminFloorLayout: jest.fn(),
    isTablePlacedOnLayout: jest.fn(),
    getActiveFloorLayoutId: jest.fn().mockResolvedValue('layout-1'),
    syncStandaloneChairUnitPricesInActiveLayout: jest.fn(),
    ...overrides,
  };
}

export type FloorLayoutServiceMock = ReturnType<
  typeof createFloorLayoutServiceMock
>;
