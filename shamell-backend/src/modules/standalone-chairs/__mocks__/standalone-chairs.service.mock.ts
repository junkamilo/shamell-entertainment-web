export function createStandaloneChairsServiceMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    getPublicStandaloneChairs: jest.fn(),
    getAdminStandaloneChairs: jest.fn(),
    upsertAdminStandaloneChairs: jest.fn(),
    patchAdminStandaloneChair: jest.fn(),
    patchAdminStandaloneChairsBulkPrice: jest.fn(),
    deleteAdminStandaloneChair: jest.fn(),
    deleteAllAdminStandaloneChairs: jest.fn(),
    ...overrides,
  };
}

export type StandaloneChairsServiceMock = ReturnType<
  typeof createStandaloneChairsServiceMock
>;
