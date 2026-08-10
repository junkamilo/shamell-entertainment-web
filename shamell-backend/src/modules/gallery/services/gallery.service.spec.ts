import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { GalleryMediaType } from '@prisma/client';
import {
  makeGalleryCategory,
  makeGalleryPhoto,
  makeMulterFile,
} from '../__mocks__/gallery.fixtures';
import {
  createGalleryServiceTestModule,
  type GalleryServiceTestHarness,
} from '../testing/gallery-service.test-module';

describe('GalleryService', () => {
  let harness: GalleryServiceTestHarness;
  let service: GalleryServiceTestHarness['service'];
  let repository: GalleryServiceTestHarness['repository'];
  let media: GalleryServiceTestHarness['media'];
  const prevEnv = { ...process.env };

  beforeEach(async () => {
    process.env = { ...prevEnv };
    harness = await createGalleryServiceTestModule();
    service = harness.service;
    repository = harness.repository;
    media = harness.media;
    jest.clearAllMocks();
    repository.findCategoryById.mockResolvedValue({ id: 'cat-1' });
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

  it('createPhoto cleans up CDN when repository create throws after upload', async () => {
    media.uploadMediaToCloudinary.mockResolvedValue({
      secureUrl: 'https://cdn.example/new.jpg',
      publicId: 'shamell/gallery/new',
      mediaType: GalleryMediaType.IMAGE,
    });
    repository.createPhoto.mockRejectedValue(new Error('db write failed'));

    await expect(
      service.createPhoto({ categoryId: 'cat-1' }, [makeMulterFile()]),
    ).rejects.toThrow('db write failed');

    expect(media.deleteMediaFromCloudinary).toHaveBeenCalledWith(
      'shamell/gallery/new',
      GalleryMediaType.IMAGE,
    );
  });

  it('ensureReferencesAreValid rejects unknown serviceId and eventId', async () => {
    repository.findServiceId.mockResolvedValue(null);
    await expect(
      service.createPhoto({ categoryId: 'cat-1', serviceId: 'svc-missing' }, [
        makeMulterFile(),
      ]),
    ).rejects.toBeInstanceOf(NotFoundException);

    repository.findServiceId.mockResolvedValue({ id: 'svc-1' });
    repository.findEventId.mockResolvedValue(null);
    await expect(
      service.createPhoto({ categoryId: 'cat-1', eventId: 'evt-missing' }, [
        makeMulterFile(),
      ]),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(media.uploadMediaToCloudinary).not.toHaveBeenCalled();
  });

  it('createCategory maps Prisma P2002 to ConflictException', async () => {
    repository.findCategorySlugConflict.mockResolvedValue(null);
    repository.createCategory.mockRejectedValue({ code: 'P2002' });
    await expect(
      service.createCategory({ name: 'Shows' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updateCategory maps Prisma P2002 to ConflictException', async () => {
    repository.findCategoryById.mockResolvedValue(makeGalleryCategory());
    repository.findCategorySlugConflict.mockResolvedValue(null);
    repository.updateCategory.mockRejectedValue({ code: 'P2002' });
    await expect(
      service.updateCategory('cat-1', { name: 'Shows' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updateCategory throws NotFound when category missing', async () => {
    repository.findCategoryById.mockResolvedValue(null);
    await expect(
      service.updateCategory('missing', { name: 'Shows' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.updateCategory).not.toHaveBeenCalled();
  });

  it('updatePhoto media replace swaps CDN assets (upload + delete old)', async () => {
    const existing = makeGalleryPhoto({
      imagePublicId: 'old-public',
      mediaType: GalleryMediaType.IMAGE,
    });
    repository.findPhotoById.mockResolvedValue(existing);
    media.uploadMediaToCloudinary.mockResolvedValue({
      secureUrl: 'https://cdn.example/swapped.jpg',
      publicId: 'shamell/gallery/swapped',
      mediaType: GalleryMediaType.IMAGE,
    });
    repository.updatePhoto.mockResolvedValue(
      makeGalleryPhoto({
        imageUrl: 'https://cdn.example/swapped.jpg',
        imagePublicId: 'shamell/gallery/swapped',
      }),
    );

    const result = await service.updatePhoto(
      'photo-1',
      { categoryId: 'cat-1' },
      makeMulterFile({ originalname: 'swap.jpg' }),
    );

    expect(repository.updatePhoto).toHaveBeenCalledWith(
      'photo-1',
      expect.objectContaining({
        imageUrl: 'https://cdn.example/swapped.jpg',
        imagePublicId: 'shamell/gallery/swapped',
        mediaType: GalleryMediaType.IMAGE,
      }),
    );
    expect(media.deleteMediaFromCloudinary).toHaveBeenCalledWith(
      'old-public',
      GalleryMediaType.IMAGE,
    );
    expect(result.photo.imagePublicId).toBe('shamell/gallery/swapped');
  });

  it('deletePhoto soft-fails CDN delete then still deletes DB row', async () => {
    repository.findPhotoById.mockResolvedValue(
      makeGalleryPhoto({
        imagePublicId: 'to-delete',
        mediaType: GalleryMediaType.IMAGE,
      }),
    );
    media.deleteMediaFromCloudinary.mockRejectedValue(
      new Error('cdn unavailable'),
    );
    repository.deletePhoto.mockResolvedValue(makeGalleryPhoto());

    await expect(service.deletePhoto('photo-1')).resolves.toEqual({
      message: 'Gallery media deleted successfully.',
    });
    expect(media.deleteMediaFromCloudinary).toHaveBeenCalledWith(
      'to-delete',
      GalleryMediaType.IMAGE,
    );
    expect(repository.deletePhoto).toHaveBeenCalledWith('photo-1');
  });

  it('createPhotosForEvent uses EVENT_CATALOG_GALLERY_CATEGORY_ID env path', async () => {
    process.env.EVENT_CATALOG_GALLERY_CATEGORY_ID = 'cat-from-env';
    repository.findCategoryById.mockResolvedValue({ id: 'cat-from-env' });
    repository.findEventId.mockResolvedValue({ id: 'event-1' });
    repository.createPhoto.mockResolvedValue(
      makeGalleryPhoto({ categoryId: 'cat-from-env', eventId: 'event-1' }),
    );

    await service.createPhotosForEvent('event-1', [makeMulterFile()]);

    expect(repository.findCategoryBySlug).not.toHaveBeenCalled();
    expect(repository.createPhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 'cat-from-env',
        eventId: 'event-1',
      }),
    );
  });

  it('getAdminCategories and getAdminPhotos map repository rows', async () => {
    repository.findAllCategories.mockResolvedValue([makeGalleryCategory()]);
    repository.findAllAdminPhotos.mockResolvedValue([makeGalleryPhoto()]);
    await expect(service.getAdminCategories()).resolves.toEqual([
      expect.objectContaining({ slug: 'shows' }),
    ]);
    await expect(service.getAdminPhotos()).resolves.toEqual([
      expect.objectContaining({ id: 'photo-1' }),
    ]);
  });

  it('updatePhoto throws NotFound when photo missing', async () => {
    repository.findPhotoById.mockResolvedValue(null);
    await expect(
      service.updatePhoto('missing', { isActive: false }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updatePhoto cleans new CDN upload when repository update throws', async () => {
    repository.findPhotoById.mockResolvedValue(
      makeGalleryPhoto({ imagePublicId: 'old-id' }),
    );
    media.uploadMediaToCloudinary.mockResolvedValue({
      secureUrl: 'https://cdn.example/failed-swap.jpg',
      publicId: 'shamell/gallery/failed-swap',
      mediaType: GalleryMediaType.IMAGE,
    });
    repository.updatePhoto.mockRejectedValue(new Error('db update failed'));

    await expect(
      service.updatePhoto('photo-1', { isActive: true }, makeMulterFile()),
    ).rejects.toThrow('db update failed');

    expect(media.deleteMediaFromCloudinary).toHaveBeenCalledWith(
      'shamell/gallery/failed-swap',
      GalleryMediaType.IMAGE,
    );
  });

  it('updateCategory toggles isActive without renaming', async () => {
    repository.findCategoryById.mockResolvedValue(makeGalleryCategory());
    repository.updateCategory.mockResolvedValue(
      makeGalleryCategory({ isActive: false }),
    );
    const result = await service.updateCategory('cat-1', { isActive: false });
    expect(result.category.isActive).toBe(false);
    expect(repository.findCategorySlugConflict).not.toHaveBeenCalled();
    expect(repository.updateCategory).toHaveBeenCalledWith('cat-1', {
      isActive: false,
    });
  });

  it('ensureReferencesAreValid rejects unknown category and serviceType', async () => {
    repository.findCategoryById.mockResolvedValue(null);
    await expect(
      service.createPhoto({ categoryId: 'cat-missing' }, [makeMulterFile()]),
    ).rejects.toBeInstanceOf(NotFoundException);

    repository.findCategoryById.mockResolvedValue({ id: 'cat-1' });
    repository.findServiceTypeId.mockResolvedValue(null);
    await expect(
      service.createPhoto(
        { categoryId: 'cat-1', serviceTypeId: 'st-missing' },
        [makeMulterFile()],
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
