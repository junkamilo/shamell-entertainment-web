export function createStandaloneChairsRepositoryMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    findActiveConfig: jest.fn(),
    countActiveChairs: jest.fn(),
    findActiveChairsPublic: jest.fn(),
    findActiveChairs: jest.fn(),
    findActiveChairsDesc: jest.fn(),
    findActiveChairById: jest.fn(),
    findActiveChairIds: jest.fn(),
    findFirstActiveChair: jest.fn(),
    maxSortOrder: jest.fn(),
    createChairsFromEntries: jest.fn(),
    updateChairUnitPrice: jest.fn(),
    updateAllActiveUnitPrices: jest.fn(),
    deleteChair: jest.fn(),
    deleteChairsByIds: jest.fn(),
    updateConfigQuantity: jest.fn(),
    createConfig: jest.fn(),
    findActiveLayout: jest.fn(),
    findPaidStandaloneChairReservations: jest.fn(),
    getPlacedStandaloneChairIds: jest.fn(),
    getActiveLayoutItems: jest.fn(),
    cleanupDeletedChairReferencesFromLayout: jest.fn(),
    ...overrides,
  };
}

export type StandaloneChairsRepositoryMock = ReturnType<
  typeof createStandaloneChairsRepositoryMock
>;
