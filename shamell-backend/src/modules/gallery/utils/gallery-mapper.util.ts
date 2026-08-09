import { GalleryMediaType } from '@prisma/client';
import {
  imageUrl as toDeliveryImageUrl,
  videoUrl as toDeliveryVideoUrl,
} from '../../../common/util/cloudinary-delivery.util';
import type {
  GalleryCategoryRow,
  MappedGalleryCategory,
  MappedGalleryPhoto,
  MappedPublicGalleryPhoto,
  PhotoWithCategory,
} from '../types/gallery.types';

export function mapGalleryCategory(
  category: GalleryCategoryRow,
): MappedGalleryCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

export function mapGalleryPhoto(photo: PhotoWithCategory): MappedGalleryPhoto {
  return {
    id: photo.id,
    categoryId: photo.categoryId,
    category: mapGalleryCategory(photo.category),
    imageUrl: photo.imageUrl,
    imagePublicId: photo.imagePublicId,
    mediaType: photo.mediaType,
    isActive: photo.isActive,
    serviceId: photo.serviceId,
    serviceTypeId: photo.serviceTypeId,
    eventId: photo.eventId,
    eventTypeId: photo.eventTypeId,
    createdAt: photo.createdAt,
    updatedAt: photo.updatedAt,
  };
}

export function mapPublicGalleryPhoto(
  photo: PhotoWithCategory,
): MappedPublicGalleryPhoto {
  const mapped = mapGalleryPhoto(photo);
  if (mapped.mediaType === GalleryMediaType.VIDEO) {
    // Static first-frame poster so the gallery can show an image instead of
    // autoplaying every video tile.
    return {
      ...mapped,
      posterUrl: toDeliveryVideoUrl(mapped.imageUrl, 'poster720'),
    };
  }
  return {
    ...mapped,
    imageUrl:
      toDeliveryImageUrl(mapped.imageUrl, 'galleryThumb') ?? mapped.imageUrl,
    posterUrl: null as string | null,
  };
}

export function slugFromDisplayName(name: string): string {
  const trimmed = name.trim();
  const withoutAccents = trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const slug = withoutAccents
    .toLowerCase()
    .replace(/&/g, ' y ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
  return slug.length >= 2 ? slug : 'categoria';
}
