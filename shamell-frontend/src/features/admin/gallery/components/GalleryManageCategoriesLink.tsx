import Link from "next/link";
import { ArrowRight, FolderOpen } from "lucide-react";
import { GALLERY_CATEGORIES_PATH } from "../lib/galleryRoutes";

export default function GalleryManageCategoriesLink() {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
      <Link
        href={GALLERY_CATEGORIES_PATH}
        className="shamell-glass-surface inline-flex items-center gap-2 rounded-full border border-gold/25 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-gold/90 transition hover:border-gold/45 hover:bg-gold/10"
      >
        <FolderOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
        Manage categories
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
      </Link>
    </div>
  );
}
