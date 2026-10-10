import type { UpsertAboutContentDto } from '../dto/upsert-about-content.dto';
import type { AboutContentResponseDto } from '../dto/about-response.dto';
import type { AboutContentRow } from '../types/about.types';

const NOW = new Date('2026-06-01T12:00:00.000Z');

export function makeAboutContentRow(
  overrides: Partial<AboutContentRow> = {},
): AboutContentRow {
  return {
    id: 'about-row-1',
    title: 'About Shamell',
    paragraph1: 'Signature performances and elevated experiences.',
    coreValues: ['Artistry', 'Excellence'],
    imageUrl:
      'https://res.cloudinary.com/demo/image/upload/v1/shamell/about/hero.jpg',
    imagePublicId: 'shamell/about/hero',
    videoDeliveryUrl: null,
    videoPosterUrl: null,
    heroMediaType: 'IMAGE',
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function makeVideoAboutContentRow(
  overrides: Partial<AboutContentRow> = {},
): AboutContentRow {
  return makeAboutContentRow({
    imageUrl:
      'https://res.cloudinary.com/demo/video/upload/v1/shamell/about/hero.mp4',
    imagePublicId: 'shamell/about/hero-video',
    heroMediaType: 'VIDEO',
    videoDeliveryUrl: null,
    videoPosterUrl: null,
    ...overrides,
  });
}

export function makeUpsertDto(
  overrides: Partial<UpsertAboutContentDto> = {},
): UpsertAboutContentDto {
  return {
    title: 'About Shamell',
    paragraph1: 'Signature performances and elevated experiences.',
    coreValues: ['Artistry', 'Excellence'],
    ...overrides,
  };
}

export function makeAboutResponse(
  overrides: Partial<AboutContentResponseDto> = {},
): AboutContentResponseDto {
  const row = makeAboutContentRow();
  return {
    id: row.id,
    title: row.title,
    paragraph1: row.paragraph1,
    coreValues: row.coreValues,
    imageUrl: row.imageUrl,
    heroMediaType: 'IMAGE',
    videoDeliveryUrl: null,
    videoPosterUrl: null,
    isActive: true,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ...overrides,
  };
}

export function makeMulterFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    fieldname: 'media',
    originalname: 'hero.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    destination: '/tmp',
    filename: 'hero.jpg',
    path: '',
    buffer: Buffer.from('fake-image'),
    stream: undefined as unknown as Express.Multer.File['stream'],
    ...overrides,
  };
}
