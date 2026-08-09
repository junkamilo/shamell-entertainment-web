export function createHeaderMediaServiceMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    getPublicHeaderPhotos: jest.fn(),
    getAdminHeaderPhotos: jest.fn(),
    uploadAdminHeaderPhotos: jest.fn(),
    toggleAdminHeaderPhoto: jest.fn(),
    updateAdminHeaderPhotoFocalPoint: jest.fn(),
    deleteAdminHeaderPhoto: jest.fn(),
    ...overrides,
  };
}

export type HeaderMediaServiceMock = ReturnType<
  typeof createHeaderMediaServiceMock
>;
