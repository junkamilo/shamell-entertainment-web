export type { GalleryCategory, GalleryCategoryPhotoPreview } from "@/app/shamell-admin/gallery/types/gallery.types";

export type FilterTab = "all" | "active" | "inactive";

export type GalleryCategoriesStats = {
  total: number;
  active: number;
  inactive: number;
  withMedia: number;
  star: string;
};
