export function createFloorLayoutRepositoryMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    findActiveLayout: jest.fn(),
    findLayoutById: jest.fn(),
    findClientSettings: jest.fn(),
    countClientEnabledUpcomingConfigs: jest.fn(),
    findActiveTablesForPalette: jest.fn(),
    findActiveChairsForPalette: jest.fn(),
    findAllActiveTables: jest.fn(),
    findAllActiveStandaloneChairs: jest.fn(),
    findActiveStandaloneChairsByIds: jest.fn(),
    updateLayoutItems: jest.fn(),
    upsertLayoutWithSideEffects: jest.fn(),
    ...overrides,
  };
}
