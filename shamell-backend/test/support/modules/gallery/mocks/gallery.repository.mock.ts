export function createGalleryRepositoryMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    findActiveCategories: jest.fn(),
    findAllCategories: jest.fn(),
    findCategoryById: jest.fn(),
    findCategoryBySlug: jest.fn(),
    findCategorySlugConflict: jest.fn(),
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
    findPublicPhotos: jest.fn(),
    countPublicPhotos: jest.fn(),
    findAllAdminPhotos: jest.fn(),
    findPhotoById: jest.fn(),
    createPhoto: jest.fn(),
    updatePhoto: jest.fn(),
    deletePhoto: jest.fn(),
    findServiceId: jest.fn(),
    findServiceTypeId: jest.fn(),
    findEventId: jest.fn(),
    findEventTypeId: jest.fn(),
    ...overrides,
  };
}

export type GalleryRepositoryMock = ReturnType<
  typeof createGalleryRepositoryMock
>;
