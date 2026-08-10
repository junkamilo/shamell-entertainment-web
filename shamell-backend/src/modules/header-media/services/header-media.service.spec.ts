import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GalleryMediaType } from '@prisma/client';
import {
  makeHeaderCategory,
  makeHeaderPhoto,
  makeMulterFile,
} from '../__mocks__/header-media.fixtures';
import {
  createHeaderMediaServiceTestModule,
  type HeaderMediaServiceTestHarness,
} from '../testing/header-media-service.test-module';
import { validateHeroImageDimensions } from '../utils/header-hero-image.util';
import { HeaderMediaService } from './header-media.service';

jest.mock('../utils/header-hero-image.util', () => ({
  validateHeroImageDimensions: jest.fn(),
}));

const validateHeroImageDimensionsMock =
  validateHeroImageDimensions as jest.MockedFunction<
    typeof validateHeroImageDimensions
  >;

describe('HeaderMediaService', () => {
  let harness: HeaderMediaServiceTestHarness;
  let service: HeaderMediaService;

  beforeEach(async () => {
    jest.clearAllMocks();
    harness = await createHeaderMediaServiceTestModule();
    service = harness.service;
  });

  it('getPublicHeaderPhotos returns empty when no category', async () => {
    harness.repository.findHeaderCategoryBySlug.mockResolvedValue(null);
    await expect(service.getPublicHeaderPhotos()).resolves.toEqual([]);
  });

  it('getPublicHeaderPhotos maps active photos', async () => {
    harness.repository.findHeaderCategoryBySlug.mockResolvedValue(
      makeHeaderCategory(),
    );
    harness.repository.findActivePhotosByCategory.mockResolvedValue([
      makeHeaderPhoto(),
    ]);
    const result = await service.getPublicHeaderPhotos();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('header-photo-1');
  });

  it('ensureHeaderCategory creates category when slug is missing', async () => {
    const created = makeHeaderCategory({ id: 'new-cat' });
    harness.repository.findHeaderCategoryBySlug.mockResolvedValue(null);
    harness.repository.createHeaderCategory.mockResolvedValue(created);
    harness.repository.findAllPhotosByCategory.mockResolvedValue([]);

    const result = await service.getAdminHeaderPhotos();

    expect(harness.repository.createHeaderCategory).toHaveBeenCalledWith({
      name: 'Header Principal',
      slug: 'home-header',
    });
    expect(harness.repository.findAllPhotosByCategory).toHaveBeenCalledWith(
      'new-cat',
    );
    expect(result).toEqual([]);
  });

  it('uploadAdminHeaderPhotos rejects empty files', async () => {
    await expect(service.uploadAdminHeaderPhotos([])).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(harness.gallery.createPhoto).not.toHaveBeenCalled();
  });

  it('uploadAdminHeaderPhotos rejects non image/video MIME', async () => {
    await expect(
      service.uploadAdminHeaderPhotos([
        makeMulterFile({ mimetype: 'application/pdf', originalname: 'x.pdf' }),
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(validateHeroImageDimensionsMock).not.toHaveBeenCalled();
    expect(harness.gallery.createPhoto).not.toHaveBeenCalled();
  });

  it('uploadAdminHeaderPhotos skips dimension validate for video', async () => {
    harness.repository.findHeaderCategoryBySlug.mockResolvedValue(
      makeHeaderCategory(),
    );
    harness.gallery.createPhoto.mockResolvedValue({
      message: 'ok',
      items: [
        {
          id: 'v1',
          imageUrl: 'https://cdn.example/x.mp4',
          imagePublicId: 'x',
          mediaType: GalleryMediaType.VIDEO,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    const result = await service.uploadAdminHeaderPhotos([
      makeMulterFile({
        mimetype: 'video/mp4',
        originalname: 'hero.mp4',
      }),
    ]);

    expect(validateHeroImageDimensionsMock).not.toHaveBeenCalled();
    expect(harness.gallery.createPhoto).toHaveBeenCalledWith(
      { categoryId: 'header-cat-1' },
      expect.any(Array),
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0].mediaType).toBe(GalleryMediaType.VIDEO);
  });

  it('uploadAdminHeaderPhotos calls GalleryService.createPhoto', async () => {
    harness.repository.findHeaderCategoryBySlug.mockResolvedValue(
      makeHeaderCategory(),
    );
    harness.gallery.createPhoto.mockResolvedValue({
      message: 'ok',
      items: [
        {
          id: 'p1',
          imageUrl: 'https://cdn.example/x.jpg',
          imagePublicId: 'x',
          mediaType: GalleryMediaType.IMAGE,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });
    const result = await service.uploadAdminHeaderPhotos([makeMulterFile()]);
    expect(validateHeroImageDimensionsMock).toHaveBeenCalled();
    expect(harness.gallery.createPhoto).toHaveBeenCalledWith(
      { categoryId: 'header-cat-1' },
      expect.any(Array),
    );
    expect(result.items).toHaveLength(1);
  });

  it('toggleAdminHeaderPhoto updates when photo is in category', async () => {
    harness.repository.findHeaderCategoryBySlug.mockResolvedValue(
      makeHeaderCategory(),
    );
    harness.repository.findPhotoInCategory.mockResolvedValue({
      id: 'header-photo-1',
    });
    harness.repository.updatePhotoActive.mockResolvedValue(
      makeHeaderPhoto({ isActive: false }),
    );

    const result = await service.toggleAdminHeaderPhoto(
      'header-photo-1',
      false,
    );

    expect(harness.repository.updatePhotoActive).toHaveBeenCalledWith(
      'header-photo-1',
      false,
    );
    expect(result.message).toContain('updated');
    expect(result.item.isActive).toBe(false);
  });

  it('toggleAdminHeaderPhoto throws when photo not in category', async () => {
    harness.repository.findHeaderCategoryBySlug.mockResolvedValue(
      makeHeaderCategory(),
    );
    harness.repository.findPhotoInCategory.mockResolvedValue(null);
    await expect(
      service.toggleAdminHeaderPhoto('missing', false),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deleteAdminHeaderPhoto delegates to GalleryService', async () => {
    harness.repository.findHeaderCategoryBySlug.mockResolvedValue(
      makeHeaderCategory(),
    );
    harness.repository.findPhotoInCategory.mockResolvedValue({
      id: 'header-photo-1',
    });
    harness.gallery.deletePhoto.mockResolvedValue({ message: 'deleted' });
    await expect(
      service.deleteAdminHeaderPhoto('header-photo-1'),
    ).resolves.toEqual({ message: 'deleted' });
  });

  it('deleteAdminHeaderPhoto throws NotFound when photo outside category', async () => {
    harness.repository.findHeaderCategoryBySlug.mockResolvedValue(
      makeHeaderCategory(),
    );
    harness.repository.findPhotoInCategory.mockResolvedValue(null);
    await expect(
      service.deleteAdminHeaderPhoto('outside'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(harness.gallery.deletePhoto).not.toHaveBeenCalled();
  });

  it('updateAdminHeaderPhotoFocalPoint updates via repository', async () => {
    harness.repository.findHeaderCategoryBySlug.mockResolvedValue(
      makeHeaderCategory(),
    );
    harness.repository.findPhotoInCategory.mockResolvedValue({
      id: 'header-photo-1',
    });
    harness.repository.updatePhotoFocal.mockResolvedValue(
      makeHeaderPhoto({ focalX: 10, focalY: 20 }),
    );
    const result = await service.updateAdminHeaderPhotoFocalPoint(
      'header-photo-1',
      10,
      20,
      30,
      40,
    );
    expect(result.item.focalX).toBe(10);
  });

  it('updateAdminHeaderPhotoFocalPoint throws NotFound when photo outside category', async () => {
    harness.repository.findHeaderCategoryBySlug.mockResolvedValue(
      makeHeaderCategory(),
    );
    harness.repository.findPhotoInCategory.mockResolvedValue(null);
    await expect(
      service.updateAdminHeaderPhotoFocalPoint('outside', 10, 20, 30, 40),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(harness.repository.updatePhotoFocal).not.toHaveBeenCalled();
  });
});
