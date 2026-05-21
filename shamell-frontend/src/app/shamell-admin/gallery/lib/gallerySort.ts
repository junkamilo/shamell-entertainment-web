import { GALLERY_CATCHALL_SLUG } from "@/lib/galleryConstants";
import type { GalleryCategory } from "../types/gallery.types";

export function sortActiveCategories(categories: GalleryCategory[]): GalleryCategory[] {
  return [...categories]
    .filter((c) => c.isActive)
    .sort((a, b) => {
      if (a.slug === GALLERY_CATCHALL_SLUG) return -1;
      if (b.slug === GALLERY_CATCHALL_SLUG) return 1;
      return a.name.localeCompare(b.name, "es");
    });
}
