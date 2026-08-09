export function createHeaderTextRepositoryMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    findLatestActive: jest.fn(),
    findLatest: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    ...overrides,
  };
}

export type HeaderTextRepositoryMock = ReturnType<
  typeof createHeaderTextRepositoryMock
>;
