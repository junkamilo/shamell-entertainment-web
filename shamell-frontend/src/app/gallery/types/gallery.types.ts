export type GalleryCategoryApiItem = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export type GalleryPhotoApiItem = {
  id: string;
  imageUrl: string;
  posterUrl?: string | null;
  mediaType: "IMAGE" | "VIDEO";
  category: {
    id: string;
    name: string;
    slug: string;
  };
};

export type GalleryPhotosResponse = {
  items: GalleryPhotoApiItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type GalleryTabItem = {
  id: string;
  label: string;
};

export type GalleryPhotoItem = {
  id: string;
  src: string;
  posterUrl: string | null;
  alt: string;
  categorySlug: string;
  mediaType: "IMAGE" | "VIDEO";
};
