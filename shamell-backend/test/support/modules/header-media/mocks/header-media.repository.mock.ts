export function createHeaderMediaRepositoryMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    findHeaderCategoryBySlug: jest.fn(),
    createHeaderCategory: jest.fn(),
    findActivePhotosByCategory: jest.fn(),
    findAllPhotosByCategory: jest.fn(),
    findPhotoInCategory: jest.fn(),
    updatePhotoActive: jest.fn(),
    updatePhotoFocal: jest.fn(),
    ...overrides,
  };
}

export type HeaderMediaRepositoryMock = ReturnType<
  typeof createHeaderMediaRepositoryMock
>;
