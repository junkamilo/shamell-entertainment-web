import { GalleryMediaType } from '@prisma/client';
import {
  makeGalleryCategory,
  makeGalleryPhoto,
} from '../__mocks__/gallery.fixtures';
import {
  mapGalleryCategory,
  mapGalleryPhoto,
  mapPublicGalleryPhoto,
  slugFromDisplayName,
} from './gallery-mapper.util';

describe('gallery-mapper.util', () => {
  it('mapGalleryCategory maps row fields', () => {
    const category = makeGalleryCategory();
    expect(mapGalleryCategory(category)).toEqual({
      id: category.id,
      name: category.name,
      slug: category.slug,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    });
  });

  it('mapGalleryPhoto includes nested category', () => {
    const photo = makeGalleryPhoto();
    const mapped = mapGalleryPhoto(photo);
    expect(mapped.id).toBe(photo.id);
    expect(mapped.category.slug).toBe('shows');
    expect(mapped.imageUrl).toBe(photo.imageUrl);
  });

  it('mapPublicGalleryPhoto adds thumb for images', () => {
    const photo = makeGalleryPhoto();
    const mapped = mapPublicGalleryPhoto(photo);
    expect(mapped.posterUrl).toBeNull();
    expect(mapped.imageUrl).toContain('upload/');
  });

  it('mapPublicGalleryPhoto adds poster for videos', () => {
    const photo = makeGalleryPhoto({
      mediaType: GalleryMediaType.VIDEO,
      imageUrl:
        'https://res.cloudinary.com/demo/video/upload/v1/shamell/gallery/x.mp4',
    });
    const mapped = mapPublicGalleryPhoto(photo);
    expect(mapped.posterUrl).toBeTruthy();
    expect(mapped.mediaType).toBe(GalleryMediaType.VIDEO);
  });

  it('slugFromDisplayName normalizes accents and punctuation', () => {
    expect(slugFromDisplayName('Bailes & Fiestas')).toBe('bailes-y-fiestas');
    expect(slugFromDisplayName('A')).toBe('categoria');
  });
});
