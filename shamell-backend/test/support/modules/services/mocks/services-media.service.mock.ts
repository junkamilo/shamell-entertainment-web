export function createServicesMediaServiceMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    ensureCloudinaryEnv: jest.fn(),
    uploadServiceMediaToCloudinary: jest.fn(),
    deleteImageFromCloudinaryByUrl: jest.fn(),
    extractCloudinaryPublicIdFromUrl: jest.fn(),
    ...overrides,
  };
}

export type ServicesMediaServiceMock = ReturnType<
  typeof createServicesMediaServiceMock
>;
