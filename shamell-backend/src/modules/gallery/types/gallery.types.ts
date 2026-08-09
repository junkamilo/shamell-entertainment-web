import { GalleryMediaType } from '@prisma/client';

export type GalleryCategoryRow = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PhotoWithCategory = {
  id: string;
  categoryId: string;
  imageUrl: string;
  imagePublicId: string;
  mediaType: GalleryMediaType;
  isActive: boolean;
  serviceId: string | null;
  serviceTypeId: string | null;
  eventId: string | null;
  eventTypeId: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: GalleryCategoryRow;
};

export type MappedGalleryCategory = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type MappedGalleryPhoto = {
  id: string;
  categoryId: string;
  category: MappedGalleryCategory;
  imageUrl: string;
  imagePublicId: string;
  mediaType: GalleryMediaType;
  isActive: boolean;
  serviceId: string | null;
  serviceTypeId: string | null;
  eventId: string | null;
  eventTypeId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MappedPublicGalleryPhoto = MappedGalleryPhoto & {
  posterUrl: string | null;
};

export type GalleryCloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
  mediaType: GalleryMediaType;
};

export type PreparedGalleryMulterFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

export type GalleryPhotoCreateData = {
  categoryId: string;
  imageUrl: string;
  imagePublicId: string;
  mediaType: GalleryMediaType;
  serviceId?: string;
  serviceTypeId?: string;
  eventId?: string;
  eventTypeId?: string;
};

export type GalleryPhotoUpdateData = {
  categoryId?: string;
  isActive?: boolean;
  serviceId?: string | null;
  serviceTypeId?: string | null;
  eventId?: string | null;
  eventTypeId?: string | null;
  imageUrl?: string;
  imagePublicId?: string;
  mediaType?: GalleryMediaType;
};

export type GalleryPublicPhotosWhere = {
  isActive: true;
  category: {
    slug?: string;
    isActive: true;
  };
};
