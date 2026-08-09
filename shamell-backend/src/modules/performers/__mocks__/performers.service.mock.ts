export function createPerformersServiceMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    ...overrides,
  };
}

export type PerformersServiceMock = ReturnType<
  typeof createPerformersServiceMock
>;
