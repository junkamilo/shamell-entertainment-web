import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import {
  makeHeaderCategory,
  makeHeaderPhoto,
} from '../__mocks__/header-media.fixtures';
import { HEADER_PHOTO_SELECT } from '../constants/header-media.constants';
import { HeaderMediaRepository } from './header-media.repository';

describe('HeaderMediaRepository', () => {
  let repository: HeaderMediaRepository;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        HeaderMediaRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(HeaderMediaRepository);
  });

  it('findHeaderCategoryBySlug queries by slug', async () => {
    const cat = makeHeaderCategory();
    prisma.galleryCategory.findFirst.mockResolvedValue(cat);
    await expect(
      repository.findHeaderCategoryBySlug('home-header'),
    ).resolves.toEqual(cat);
  });

  it('createHeaderCategory creates with select', async () => {
    const cat = makeHeaderCategory();
    prisma.galleryCategory.create.mockResolvedValue(cat);
    await expect(
      repository.createHeaderCategory({
        name: 'Header Principal',
        slug: 'home-header',
      }),
    ).resolves.toEqual(cat);
  });

  it('findActivePhotosByCategory filters active', async () => {
    const photo = makeHeaderPhoto();
    prisma.galleryPhoto.findMany.mockResolvedValue([photo]);
    await expect(
      repository.findActivePhotosByCategory('header-cat-1'),
    ).resolves.toEqual([photo]);
    expect(prisma.galleryPhoto.findMany).toHaveBeenCalledWith({
      where: { categoryId: 'header-cat-1', isActive: true },
      orderBy: { createdAt: 'asc' },
      select: HEADER_PHOTO_SELECT,
    });
  });

  it('updatePhotoActive and updatePhotoFocal delegate', async () => {
    const photo = makeHeaderPhoto({ isActive: false });
    prisma.galleryPhoto.update.mockResolvedValue(photo);
    await expect(
      repository.updatePhotoActive('header-photo-1', false),
    ).resolves.toEqual(photo);
    await expect(
      repository.updatePhotoFocal('header-photo-1', {
        focalX: 40,
        focalY: 40,
        focalMobileX: 45,
        focalMobileY: 45,
      }),
    ).resolves.toEqual(photo);
  });

  it('findPhotoInCategory scopes to category', async () => {
    prisma.galleryPhoto.findFirst.mockResolvedValue({ id: 'header-photo-1' });
    await expect(
      repository.findPhotoInCategory('header-photo-1', 'header-cat-1'),
    ).resolves.toEqual({ id: 'header-photo-1' });
  });
});
