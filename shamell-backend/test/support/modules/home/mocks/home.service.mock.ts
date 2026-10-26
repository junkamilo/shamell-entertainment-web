export function createHomeServiceMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    getAboveFoldData: jest.fn(),
    ...overrides,
  };
}

export type HomeServiceMock = ReturnType<typeof createHomeServiceMock>;
