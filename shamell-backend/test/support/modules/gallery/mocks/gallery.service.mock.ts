export function createGalleryServiceMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    getPublicCategories: jest.fn(),
    getPublicPhotos: jest.fn(),
    getAdminCategories: jest.fn(),
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
    getAdminPhotos: jest.fn(),
    createPhoto: jest.fn(),
    createPhotosForEvent: jest.fn(),
    updatePhoto: jest.fn(),
    deletePhoto: jest.fn(),
    ...overrides,
  };
}

export type GalleryServiceMock = ReturnType<typeof createGalleryServiceMock>;
