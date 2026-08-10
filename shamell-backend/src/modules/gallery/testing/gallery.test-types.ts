/** Narrow response shapes for gallery e2e / deep HTTP tests (no any). */

export type ErrorBody = {
  statusCode: number;
  message: string | string[];
  error?: string;
};

export type CategoryBody = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type CategoryMutationBody = {
  message: string;
  category: CategoryBody;
};

export type PhotoBody = {
  id: string;
  categoryId: string;
  imageUrl: string;
  imagePublicId: string;
  mediaType: string;
  isActive: boolean;
  serviceId?: string | null;
  serviceTypeId?: string | null;
  eventId?: string | null;
  eventTypeId?: string | null;
  category?: CategoryBody;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  posterUrl?: string | null;
};

export type PhotoMutationBody = {
  message: string;
  photo?: PhotoBody;
  items?: PhotoBody[];
};

export type PhotoListBody = {
  items: PhotoBody[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type DeletePhotoBody = {
  message: string;
};
