import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AdminJwtGuard } from '../../../common/auth/admin-jwt.guard';
import {
  makeGalleryCategory,
  makeGalleryPhoto,
  makeMulterFile,
} from '../__mocks__/gallery.fixtures';
import { createGalleryServiceMock } from '../__mocks__/gallery.service.mock';
import { GalleryService } from '../services/gallery.service';
import { GalleryController } from './gallery.controller';

describe('GalleryController', () => {
  let controller: GalleryController;
  const galleryService = createGalleryServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [GalleryController],
      providers: [{ provide: GalleryService, useValue: galleryService }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(GalleryController);
  });

  it('getPublicCategories delegates to service', async () => {
    const payload = [makeGalleryCategory()].map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      isActive: c.isActive,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
    galleryService.getPublicCategories.mockResolvedValue(payload);
    await expect(controller.getPublicCategories()).resolves.toEqual(payload);
  });

  it('getPublicPhotos passes query params', async () => {
    galleryService.getPublicPhotos.mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 6, total: 0, totalPages: 1 },
    });
    await controller.getPublicPhotos('shows', 1, 6);
    expect(galleryService.getPublicPhotos).toHaveBeenCalledWith({
      category: 'shows',
      page: 1,
      limit: 6,
    });
  });

  it('getAdminCategories delegates to service', async () => {
    galleryService.getAdminCategories.mockResolvedValue([]);
    await expect(controller.getAdminCategories()).resolves.toEqual([]);
  });

  it('createCategory delegates dto', async () => {
    galleryService.createCategory.mockResolvedValue({
      message: 'ok',
      category: makeGalleryCategory(),
    });
    await controller.createCategory({ name: 'Shows' });
    expect(galleryService.createCategory).toHaveBeenCalledWith({
      name: 'Shows',
    });
  });

  it('updateCategory rejects empty body', () => {
    expect(() => controller.updateCategory('cat-1', {})).toThrow(
      BadRequestException,
    );
  });

  it('createPhoto requires media files', () => {
    expect(() =>
      controller.createPhoto({ categoryId: 'cat-1' }, undefined),
    ).toThrow(BadRequestException);
  });

  it('createPhoto passes files to service', async () => {
    galleryService.createPhoto.mockResolvedValue({
      message: 'ok',
      items: [makeGalleryPhoto()],
    });
    const files = [makeMulterFile()];
    await controller.createPhoto({ categoryId: 'cat-1' }, files);
    expect(galleryService.createPhoto).toHaveBeenCalledWith(
      { categoryId: 'cat-1' },
      files,
    );
  });

  it('updatePhoto requires body or media', () => {
    expect(() => controller.updatePhoto('photo-1', {}, undefined)).toThrow(
      BadRequestException,
    );
  });

  it('deletePhoto delegates id', async () => {
    galleryService.deletePhoto.mockResolvedValue({ message: 'ok' });
    await expect(controller.deletePhoto('photo-1')).resolves.toEqual({
      message: 'ok',
    });
  });
});
