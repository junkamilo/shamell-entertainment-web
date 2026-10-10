export function createAboutRepositoryMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    findLatest: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    clearHeroMedia: jest.fn(),
    ...overrides,
  };
}
