export function createAboutServiceMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    getPublicAboutContent: jest.fn(),
    getPublicAboutContentOrNull: jest.fn(),
    getAdminAboutContent: jest.fn(),
    upsertAdminAboutContent: jest.fn(),
    deleteAdminAboutHeroMedia: jest.fn(),
    backfillVideoDeliveryUrls: jest.fn(),
    ...overrides,
  };
}
