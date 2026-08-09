export function createHealthServiceMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    liveness: jest.fn(),
    readiness: jest.fn(),
    ...overrides,
  };
}

export type HealthServiceMock = ReturnType<typeof createHealthServiceMock>;
