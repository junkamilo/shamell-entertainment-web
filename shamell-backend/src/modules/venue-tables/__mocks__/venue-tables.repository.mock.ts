export function createVenueTablesRepositoryMock() {
  return {
    asPrisma: jest.fn(),
    runTransaction: jest.fn(),
    findActiveTables: jest.fn().mockResolvedValue([]),
    findAllTables: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
    findAllTableNames: jest.fn().mockResolvedValue([]),
    maxSortOrder: jest.fn().mockResolvedValue(-1),
    create: jest.fn(),
    update: jest.fn(),
    updateManyActiveBySize: jest.fn().mockResolvedValue({ count: 0 }),
    createManyFromEntries: jest.fn().mockResolvedValue([]),
    bulkDeleteActiveTables: jest
      .fn()
      .mockResolvedValue({ size: null, deletedCount: 0 }),
  };
}

export type VenueTablesRepositoryMock = ReturnType<
  typeof createVenueTablesRepositoryMock
>;
