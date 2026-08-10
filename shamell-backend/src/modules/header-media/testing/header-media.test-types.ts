/** Narrow response shapes for header-media e2e / deep HTTP tests (no any). */

export type ErrorBody = {
  statusCode: number;
  message: string | string[];
  error?: string;
};

export type HeaderPhotoBody = {
  id: string;
  imageUrl: string | null;
  imageUrlMobile?: string | null;
  videoDeliveryUrl?: string | null;
  videoPosterUrl?: string | null;
  videoPosterUrlMobile?: string | null;
  imagePublicId: string;
  mediaType: string;
  focalX: number;
  focalY: number;
  focalMobileX: number;
  focalMobileY: number;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type HeaderPhotoListBody = HeaderPhotoBody[];

export type HeaderPhotoMutationBody = {
  message: string;
  item?: HeaderPhotoBody;
  items?: HeaderPhotoBody[];
};

export type HeaderPhotoDeleteBody = {
  message: string;
};
