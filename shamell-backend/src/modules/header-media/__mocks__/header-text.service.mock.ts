export function createHeaderTextServiceMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    getPublicHeaderText: jest.fn(),
    getAdminHeaderText: jest.fn(),
    upsertAdminHeaderText: jest.fn(),
    ...overrides,
  };
}

export type HeaderTextServiceMock = ReturnType<
  typeof createHeaderTextServiceMock
>;
