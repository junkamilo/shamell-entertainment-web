import { GalleryMediaType } from '@prisma/client';
import type { HeaderFont } from '../constants/header-media.constants';

export type HeaderPhotoRow = {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  mediaType: GalleryMediaType;
  focalX: number;
  focalY: number;
  focalMobileX: number;
  focalMobileY: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type HeaderCategoryRow = {
  id: string;
  name: string;
  slug: string;
};

export type MappedHeaderPhoto = {
  id: string;
  imageUrl: string | null;
  imageUrlMobile: string | null;
  videoDeliveryUrl: string | null;
  videoPosterUrl: string | null;
  videoPosterUrlMobile: string | null;
  imagePublicId: string;
  mediaType: GalleryMediaType;
  focalX: number;
  focalY: number;
  focalMobileX: number;
  focalMobileY: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type HeaderTextResponse = {
  headline: string;
  headlineFont: HeaderFont;
  headlineColor: string;
  tagline: string;
  taglineFont: HeaderFont;
  taglineColor: string;
  quote: string;
  quoteFont: HeaderFont;
  quoteColor: string;
  isActive: boolean;
  updatedAt: string | null;
};

export type AdminHeaderTextResponse = HeaderTextResponse & { id: string };

export type HeaderTextCreateData = {
  isActive: boolean;
  headline: string;
  headlineFont: string;
  headlineColor: string;
  tagline: string;
  taglineFont: string;
  taglineColor: string;
  quote: string;
  quoteFont: string;
  quoteColor: string;
};

export type HeaderTextUpdateData = Partial<HeaderTextCreateData>;
