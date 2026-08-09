import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GalleryMediaType } from '@prisma/client';
import { createGalleryMediaServiceMock } from '../__mocks__/gallery-media.service.mock';
import {
  makeGalleryCategory,
  makeGalleryPhoto,
  makeMulterFile,
} from '../__mocks__/gallery.fixtures';
import { createGalleryRepositoryMock } from '../__mocks__/gallery.repository.mock';
import { GalleryMediaService } from './gallery-media.service';
import { GalleryRepository } from './gallery.repository';
import { GalleryService } from './gallery.service';

describe('GalleryService', () => {
  let service: GalleryService;
  const repository = createGalleryRepositoryMock();
  const media = createGalleryMediaServiceMock();
  const prevEnv = { ...process.env };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env = { ...prevEnv };
    repository.findCategoryById.mockResolvedValue({ id: 'cat-1' });
    const moduleRef = await Test.createTestingModule({
      providers: [
        GalleryService,
        { provide: GalleryRepository, useValue: repository },
        { provide: GalleryMediaService, useValue: media },
      ],
    }).compile();
    service = moduleRef.get(GalleryService);
  });

  afterEach(() => {
    process.env = { ...prevEnv };
  });

  it('getPublicCategories maps active categories', async () => {
    repository.findActiveCategories.mockResolvedValue([makeGalleryCategory()]);
    await expect(service.getPublicCategories()).resolves.toEqual([
      expect.objectContaining({ slug: 'shows' }),
    ]);
  });

  it('getPublicPhotos paginates and maps items', async () => {
    repository.findPublicPhotos.mockResolvedValue([makeGalleryPhoto()]);
    repository.countPublicPhotos.mockResolvedValue(1);
    const result = await service.getPublicPhotos({ page: 1, limit: 6 });
    expect(result.items).toHaveLength(1);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 6,
      total: 1,
      totalPages: 1,
    });
  });

  it('createCategory generates slug and creates', async () => {
    repository.findCategorySlugConflict.mockResolvedValue(null);
    repository.createCategory.mockResolvedValue(makeGalleryCategory());
    const result = await service.createCategory({ name: 'Shows' });
    expect(result.message).toContain('created');
    expect(repository.createCategory).toHaveBeenCalledWith({
      name: 'Shows',
      slug: 'shows',
    });
  });

  it('createPhoto uploads then persists', async () => {
    const photo = makeGalleryPhoto();
    repository.createPhoto.mockResolvedValue(photo);
    const result = await service.createPhoto({ categoryId: 'cat-1' }, [
      makeMulterFile(),
    ]);
    expect(media.ensureCloudinaryEnv).toHaveBeenCalled();
    expect(media.uploadMediaToCloudinary).toHaveBeenCalled();
    expect(result.items).toHaveLength(1);
    expect(result.message).toContain('1 media');
  });

  it('createPhotosForEvent resolves category by slug', async () => {
    delete process.env.EVENT_CATALOG_GALLERY_CATEGORY_ID;
    repository.findCategoryBySlug.mockResolvedValue({ id: 'cat-event' });
    repository.createPhoto.mockResolvedValue(
      makeGalleryPhoto({ categoryId: 'cat-event', eventId: 'event-1' }),
    );
    repository.findEventId.mockResolvedValue({ id: 'event-1' });
    await service.createPhotosForEvent('event-1', [makeMulterFile()]);
    expect(repository.findCategoryBySlug).toHaveBeenCalledWith('event-catalog');
    expect(repository.createPhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 'cat-event',
        eventId: 'event-1',
      }),
    );
  });

  it('createPhotosForEvent throws when category missing', async () => {
    delete process.env.EVENT_CATALOG_GALLERY_CATEGORY_ID;
    repository.findCategoryBySlug.mockResolvedValue(null);
    await expect(
      service.createPhotosForEvent('event-1', [makeMulterFile()]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updatePhoto replaces media and deletes old cloudinary asset', async () => {
    const existing = makeGalleryPhoto({
      imagePublicId: 'old-id',
      mediaType: GalleryMediaType.IMAGE,
    });
    repository.findPhotoById.mockResolvedValue(existing);
    repository.updatePhoto.mockResolvedValue(
      makeGalleryPhoto({ imagePublicId: 'shamell/gallery/up' }),
    );
    const result = await service.updatePhoto(
      'photo-1',
      { isActive: false },
      makeMulterFile(),
    );
    expect(result.message).toContain('updated');
    expect(media.deleteMediaFromCloudinary).toHaveBeenCalledWith(
      'old-id',
      GalleryMediaType.IMAGE,
    );
  });

  it('deletePhoto removes cloudinary then db row', async () => {
    repository.findPhotoById.mockResolvedValue(makeGalleryPhoto());
    repository.deletePhoto.mockResolvedValue(makeGalleryPhoto());
    await expect(service.deletePhoto('photo-1')).resolves.toEqual({
      message: 'Gallery media deleted successfully.',
    });
    expect(media.deleteMediaFromCloudinary).toHaveBeenCalled();
    expect(repository.deletePhoto).toHaveBeenCalledWith('photo-1');
  });

  it('deletePhoto throws when missing', async () => {
    repository.findPhotoById.mockResolvedValue(null);
    await expect(service.deletePhoto('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
