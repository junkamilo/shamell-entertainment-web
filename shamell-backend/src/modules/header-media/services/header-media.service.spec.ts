import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GalleryMediaType } from '@prisma/client';
import { createGalleryServiceMock } from '../../gallery/__mocks__/gallery.service.mock';
import { GalleryService } from '../../gallery/services/gallery.service';
import {
  makeHeaderCategory,
  makeHeaderPhoto,
  makeMulterFile,
} from '../__mocks__/header-media.fixtures';
import { createHeaderMediaRepositoryMock } from '../__mocks__/header-media.repository.mock';
import { HeaderMediaRepository } from './header-media.repository';
import { HeaderMediaService } from './header-media.service';

jest.mock('../utils/header-hero-image.util', () => ({
  validateHeroImageDimensions: jest.fn(),
}));

describe('HeaderMediaService', () => {
  let service: HeaderMediaService;
  const repository = createHeaderMediaRepositoryMock();
  const gallery = createGalleryServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        HeaderMediaService,
        { provide: HeaderMediaRepository, useValue: repository },
        { provide: GalleryService, useValue: gallery },
      ],
    }).compile();
    service = moduleRef.get(HeaderMediaService);
  });

  it('getPublicHeaderPhotos returns empty when no category', async () => {
    repository.findHeaderCategoryBySlug.mockResolvedValue(null);
    await expect(service.getPublicHeaderPhotos()).resolves.toEqual([]);
  });

  it('getPublicHeaderPhotos maps active photos', async () => {
    repository.findHeaderCategoryBySlug.mockResolvedValue(makeHeaderCategory());
    repository.findActivePhotosByCategory.mockResolvedValue([
      makeHeaderPhoto(),
    ]);
    const result = await service.getPublicHeaderPhotos();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('header-photo-1');
  });

  it('uploadAdminHeaderPhotos calls GalleryService.createPhoto', async () => {
    repository.findHeaderCategoryBySlug.mockResolvedValue(makeHeaderCategory());
    gallery.createPhoto.mockResolvedValue({
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
    expect(gallery.createPhoto).toHaveBeenCalledWith(
      { categoryId: 'header-cat-1' },
      expect.any(Array),
    );
    expect(result.items).toHaveLength(1);
  });

  it('toggleAdminHeaderPhoto throws when photo not in category', async () => {
    repository.findHeaderCategoryBySlug.mockResolvedValue(makeHeaderCategory());
    repository.findPhotoInCategory.mockResolvedValue(null);
    await expect(
      service.toggleAdminHeaderPhoto('missing', false),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deleteAdminHeaderPhoto delegates to GalleryService', async () => {
    repository.findHeaderCategoryBySlug.mockResolvedValue(makeHeaderCategory());
    repository.findPhotoInCategory.mockResolvedValue({ id: 'header-photo-1' });
    gallery.deletePhoto.mockResolvedValue({ message: 'deleted' });
    await expect(
      service.deleteAdminHeaderPhoto('header-photo-1'),
    ).resolves.toEqual({ message: 'deleted' });
  });

  it('updateAdminHeaderPhotoFocalPoint updates via repository', async () => {
    repository.findHeaderCategoryBySlug.mockResolvedValue(makeHeaderCategory());
    repository.findPhotoInCategory.mockResolvedValue({ id: 'header-photo-1' });
    repository.updatePhotoFocal.mockResolvedValue(
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
});
