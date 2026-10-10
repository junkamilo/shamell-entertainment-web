export function createVenueLayoutSettingsMediaServiceMock() {
  return {
    ensureCloudinaryEnv: jest.fn(),
    ensurePromoImageFile: jest.fn(),
    uploadImage: jest.fn().mockResolvedValue({
      secureUrl: 'https://cdn.example/promo.jpg',
      publicId: 'shamell/on-coming-events/promo',
    }),
    deleteImage: jest.fn().mockResolvedValue(undefined),
  };
}

export type VenueLayoutSettingsMediaServiceMock = ReturnType<
  typeof createVenueLayoutSettingsMediaServiceMock
>;
