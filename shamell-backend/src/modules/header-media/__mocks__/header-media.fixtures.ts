import { GalleryMediaType } from '@prisma/client';
import type { HeroHeaderContent } from '@prisma/client';
import { DEFAULT_HEADER_TEXT } from '../constants/header-media.constants';
import type {
  HeaderCategoryRow,
  HeaderPhotoRow,
} from '../types/header-media.types';

export function makeHeaderCategory(
  overrides: Partial<HeaderCategoryRow> = {},
): HeaderCategoryRow {
  return {
    id: 'header-cat-1',
    name: 'Header Principal',
    slug: 'home-header',
    ...overrides,
  };
}

export function makeHeaderPhoto(
  overrides: Partial<HeaderPhotoRow> = {},
): HeaderPhotoRow {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: 'header-photo-1',
    imageUrl:
      'https://res.cloudinary.com/demo/image/upload/v1/shamell/gallery/hero.jpg',
    imagePublicId: 'shamell/gallery/hero',
    mediaType: GalleryMediaType.IMAGE,
    focalX: 50,
    focalY: 35,
    focalMobileX: 50,
    focalMobileY: 35,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function makeHeroHeaderContent(
  overrides: Partial<HeroHeaderContent> = {},
): HeroHeaderContent {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: 'hero-text-1',
    ...DEFAULT_HEADER_TEXT,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function makeMulterFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    fieldname: 'images',
    originalname: 'hero.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.alloc(64),
    destination: '',
    filename: '',
    path: '',
    stream: undefined as never,
    ...overrides,
  };
}
