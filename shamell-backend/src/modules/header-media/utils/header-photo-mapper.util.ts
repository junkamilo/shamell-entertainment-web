import { GalleryMediaType } from '@prisma/client';
import {
  imageUrl as toHeroImageUrl,
  videoUrl as toVideoUrl,
} from '../../../common/util/cloudinary-delivery.util';
import type {
  HeaderPhotoRow,
  MappedHeaderPhoto,
} from '../types/header-media.types';

export function mapHeaderPhoto(photo: HeaderPhotoRow): MappedHeaderPhoto {
  const isVideo = photo.mediaType === GalleryMediaType.VIDEO;
  // VIDEO: imageUrl is null; the hero plays `videoDeliveryUrl` and shows the
  // poster (720/480) as the LCP image. IMAGE: responsive desktop/mobile pair
  // consumed via <img srcset> on the public hero.
  return {
    id: photo.id,
    imageUrl: isVideo ? null : toHeroImageUrl(photo.imageUrl, 'hero'),
    imageUrlMobile: isVideo
      ? null
      : toHeroImageUrl(photo.imageUrl, 'heroMobile'),
    videoDeliveryUrl: isVideo ? toVideoUrl(photo.imageUrl, 'stream720') : null,
    videoPosterUrl: isVideo ? toVideoUrl(photo.imageUrl, 'poster720') : null,
    videoPosterUrlMobile: isVideo
      ? toVideoUrl(photo.imageUrl, 'poster480')
      : null,
    imagePublicId: photo.imagePublicId,
    mediaType: photo.mediaType,
    focalX: photo.focalX,
    focalY: photo.focalY,
    focalMobileX: photo.focalMobileX,
    focalMobileY: photo.focalMobileY,
    isActive: photo.isActive,
    createdAt: photo.createdAt,
    updatedAt: photo.updatedAt,
  };
}

// Admin mapper: reuses the public payload but restores a playable `imageUrl`
// for VIDEO so the admin library/focus preview (which renders <video src>)
// keeps working. The public mapper intentionally returns imageUrl: null.
export function mapHeaderPhotoAdmin(photo: HeaderPhotoRow): MappedHeaderPhoto {
  const base = mapHeaderPhoto(photo);
  if (photo.mediaType === GalleryMediaType.VIDEO) {
    return { ...base, imageUrl: photo.imageUrl };
  }
  return base;
}
