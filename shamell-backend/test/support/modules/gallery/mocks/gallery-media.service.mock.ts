import { GalleryMediaType } from '@prisma/client';

export function createGalleryMediaServiceMock(
  overrides: Record<string, jest.Mock> = {},
) {
  return {
    ensureCloudinaryEnv: jest.fn(),
    ensureMediaFile: jest.fn(),
    prepareMulterFileForCloudinary: jest
      .fn()
      .mockImplementation((file: Express.Multer.File) =>
        Promise.resolve({
          buffer: file.buffer,
          mimetype: file.mimetype,
          originalname: file.originalname,
        }),
      ),
    uploadMediaToCloudinary: jest.fn().mockResolvedValue({
      secureUrl: 'https://cdn.example/up.jpg',
      publicId: 'shamell/gallery/up',
      mediaType: GalleryMediaType.IMAGE,
    }),
    deleteMediaFromCloudinary: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export type GalleryMediaServiceMock = ReturnType<
  typeof createGalleryMediaServiceMock
>;
