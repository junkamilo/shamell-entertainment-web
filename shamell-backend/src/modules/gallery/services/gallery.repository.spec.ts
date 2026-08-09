import { Test } from '@nestjs/testing';
import { GalleryMediaType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import {
  makeGalleryCategory,
  makeGalleryPhoto,
} from '../__mocks__/gallery.fixtures';
import { GalleryRepository } from './gallery.repository';

describe('GalleryRepository', () => {
  let repository: GalleryRepository;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        GalleryRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(GalleryRepository);
  });

  it('findActiveCategories orders by name', async () => {
    const rows = [makeGalleryCategory()];
    prisma.galleryCategory.findMany.mockResolvedValue(rows);
    await expect(repository.findActiveCategories()).resolves.toEqual(rows);
    expect(prisma.galleryCategory.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  });

  it('createCategory delegates to prisma', async () => {
    const created = makeGalleryCategory();
    prisma.galleryCategory.create.mockResolvedValue(created);
    await expect(
      repository.createCategory({ name: 'Shows', slug: 'shows' }),
    ).resolves.toEqual(created);
  });

  it('findPublicPhotos includes category', async () => {
    const photo = makeGalleryPhoto();
    prisma.galleryPhoto.findMany.mockResolvedValue([photo]);
    const where = {
      isActive: true as const,
      category: { isActive: true as const },
    };
    await expect(
      repository.findPublicPhotos({ where, skip: 0, take: 6 }),
    ).resolves.toEqual([photo]);
    expect(prisma.galleryPhoto.findMany).toHaveBeenCalledWith({
      where,
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 6,
      include: { category: true },
    });
  });

  it('createPhoto persists media fields', async () => {
    const photo = makeGalleryPhoto();
    prisma.galleryPhoto.create.mockResolvedValue(photo);
    await expect(
      repository.createPhoto({
        categoryId: 'cat-1',
        imageUrl: photo.imageUrl,
        imagePublicId: photo.imagePublicId,
        mediaType: GalleryMediaType.IMAGE,
        eventId: 'event-1',
      }),
    ).resolves.toEqual(photo);
    expect(prisma.galleryPhoto.create).toHaveBeenCalledWith({
      data: {
        categoryId: 'cat-1',
        imageUrl: photo.imageUrl,
        imagePublicId: photo.imagePublicId,
        mediaType: GalleryMediaType.IMAGE,
        eventId: 'event-1',
      },
      include: { category: true },
    });
  });

  it('findPhotoById and deletePhoto delegate', async () => {
    const photo = makeGalleryPhoto();
    prisma.galleryPhoto.findUnique.mockResolvedValue(photo);
    prisma.galleryPhoto.delete.mockResolvedValue(photo);
    await expect(repository.findPhotoById('photo-1')).resolves.toEqual(photo);
    await expect(repository.deletePhoto('photo-1')).resolves.toEqual(photo);
  });

  it('FK helpers use findUnique', async () => {
    prisma.service.findUnique.mockResolvedValue({ id: 's1' });
    prisma.serviceType.findUnique.mockResolvedValue({ id: 'st1' });
    prisma.event.findUnique.mockResolvedValue({ id: 'e1' });
    prisma.eventType.findUnique.mockResolvedValue({ id: 'et1' });
    await expect(repository.findServiceId('s1')).resolves.toEqual({ id: 's1' });
    await expect(repository.findServiceTypeId('st1')).resolves.toEqual({
      id: 'st1',
    });
    await expect(repository.findEventId('e1')).resolves.toEqual({ id: 'e1' });
    await expect(repository.findEventTypeId('et1')).resolves.toEqual({
      id: 'et1',
    });
  });
});
