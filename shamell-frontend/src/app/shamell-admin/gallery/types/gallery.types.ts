export type GalleryCategory = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type GalleryCategoryPhotoPreview = {
  categoryId: string;
  imageUrl: string;
};

export type GalleryPhotoCategoryRef = {
  id: string;
  name: string;
  slug: string;
};

export type GalleryPhoto = {
  id: string;
  imageUrl: string;
  isActive: boolean;
  mediaType?: string;
  createdAt?: string;
  updatedAt?: string;
  category: GalleryPhotoCategoryRef;
};

export type GalleryStats = {
  total: number;
  visible: number;
  catsWith: number;
  recent: string;
};

export type GalleryPhotoBatchResponse = {
  items: unknown[];
};
