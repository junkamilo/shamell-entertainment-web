export function createAboutMediaServiceMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    ensureCloudinaryEnv: jest.fn(),
    ensureHeroMediaFile: jest.fn(),
    uploadHeroMedia: jest.fn(),
    deleteHeroFromCloudinary: jest.fn().mockResolvedValue(undefined),
    warmAboutVideoCdn: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}
