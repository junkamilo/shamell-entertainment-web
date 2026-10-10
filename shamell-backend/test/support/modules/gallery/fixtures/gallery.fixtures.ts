import { GalleryMediaType } from '@prisma/client';
import type {
  GalleryCategoryRow,
  PhotoWithCategory,
} from '../types/gallery.types';

export function makeGalleryCategory(
  overrides: Partial<GalleryCategoryRow> = {},
): GalleryCategoryRow {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: 'cat-1',
    name: 'Shows',
    slug: 'shows',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function makeGalleryPhoto(
  overrides: Partial<PhotoWithCategory> = {},
): PhotoWithCategory {
  const category = overrides.category ?? makeGalleryCategory();
  const now = new Date('2026-01-02T00:00:00.000Z');
  return {
    id: 'photo-1',
    categoryId: category.id,
    imageUrl:
      'https://res.cloudinary.com/demo/image/upload/v1/shamell/gallery/x.jpg',
    imagePublicId: 'shamell/gallery/x',
    mediaType: GalleryMediaType.IMAGE,
    isActive: true,
    serviceId: null,
    serviceTypeId: null,
    eventId: null,
    eventTypeId: null,
    createdAt: now,
    updatedAt: now,
    category,
    ...overrides,
  };
}

export function makeMulterFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  const jpegMagic = Buffer.alloc(12, 0);
  jpegMagic[0] = 0xff;
  jpegMagic[1] = 0xd8;
  jpegMagic[2] = 0xff;
  return {
    fieldname: 'media',
    originalname: 'photo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 128,
    buffer: jpegMagic,
    destination: '',
    filename: '',
    path: '',
    stream: undefined as never,
    ...overrides,
  };
}
