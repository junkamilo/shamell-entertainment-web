export function createVenueLayoutSettingsServiceMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    getPublicSettings: jest.fn(),
    getAdminSettings: jest.fn(),
    upsertAdminSettings: jest.fn(),
    patchAdminEnabled: jest.fn(),
    upsertAdminPromoMedia: jest.fn(),
    deleteAdminPromoMedia: jest.fn(),
    isClientEnabled: jest.fn().mockResolvedValue(false),
    ...overrides,
  };
}

export type VenueLayoutSettingsServiceMock = ReturnType<
  typeof createVenueLayoutSettingsServiceMock
>;
