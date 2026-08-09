export const HEADER_FONTS = ['brand', 'elegant', 'script', 'body'] as const;
export type HeaderFont = (typeof HEADER_FONTS)[number];

export const HEADER_HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const DEFAULT_HEADER_TEXT = {
  headline: 'SHAMELL',
  headlineFont: 'brand' as HeaderFont,
  headlineColor: '#c5a55a',
  tagline: 'Exclusive Belly Dance Performance Artistry',
  taglineFont: 'elegant' as HeaderFont,
  taglineColor: '#f5e6b8',
  quote: 'Dance is the hidden language of the soul.',
  quoteFont: 'script' as HeaderFont,
  quoteColor: '#c5a55a',
};

export const HEADER_MEDIA_FALLBACK_CATEGORY_NAME = 'Header Principal';
export const HEADER_MEDIA_FALLBACK_CATEGORY_SLUG = 'home-header';

export const HEADER_MEDIA_GALLERY_SLUG_ENV = 'HEADER_MEDIA_GALLERY_SLUG';
export const HEADER_MEDIA_GALLERY_NAME_ENV = 'HEADER_MEDIA_GALLERY_NAME';

export const HEADER_HERO_MIN_IMAGE_WIDTH = 1200;
export const HEADER_HERO_MIN_IMAGE_HEIGHT = 1200;

export const HEADER_MEDIA_UPLOAD_MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;

export const HEADER_PHOTO_SELECT = {
  id: true,
  imageUrl: true,
  imagePublicId: true,
  mediaType: true,
  focalX: true,
  focalY: true,
  focalMobileX: true,
  focalMobileY: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;
