import { GalleryMediaType } from '@prisma/client';
import { makeHeaderPhoto } from '../__mocks__/header-media.fixtures';
import {
  mapHeaderPhoto,
  mapHeaderPhotoAdmin,
} from './header-photo-mapper.util';

describe('header-photo-mapper.util', () => {
  it('maps IMAGE with hero delivery URLs', () => {
    const mapped = mapHeaderPhoto(makeHeaderPhoto());
    expect(mapped.imageUrl).toContain('upload/');
    expect(mapped.imageUrlMobile).toBeTruthy();
    expect(mapped.videoDeliveryUrl).toBeNull();
    expect(mapped.videoPosterUrl).toBeNull();
  });

  it('maps VIDEO with stream and posters; public imageUrl null', () => {
    const photo = makeHeaderPhoto({
      mediaType: GalleryMediaType.VIDEO,
      imageUrl:
        'https://res.cloudinary.com/demo/video/upload/v1/shamell/gallery/hero.mp4',
    });
    const mapped = mapHeaderPhoto(photo);
    expect(mapped.imageUrl).toBeNull();
    expect(mapped.videoDeliveryUrl).toBeTruthy();
    expect(mapped.videoPosterUrl).toBeTruthy();
    expect(mapped.videoPosterUrlMobile).toBeTruthy();
  });

  it('admin mapper restores video imageUrl', () => {
    const photo = makeHeaderPhoto({
      mediaType: GalleryMediaType.VIDEO,
      imageUrl:
        'https://res.cloudinary.com/demo/video/upload/v1/shamell/gallery/hero.mp4',
    });
    const mapped = mapHeaderPhotoAdmin(photo);
    expect(mapped.imageUrl).toBe(photo.imageUrl);
  });
});
