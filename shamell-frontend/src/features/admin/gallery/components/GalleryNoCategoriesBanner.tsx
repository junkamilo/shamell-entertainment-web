import Link from "next/link";
import { GALLERY_CATEGORIES_PATH } from "../lib/galleryRoutes";

export default function GalleryNoCategoriesBanner() {
  return (
    <div className="mb-8 rounded-xl border border-amber-400/25 bg-amber-500/10 px-5 py-4 text-sm text-foreground/85">
      You need at least one active category to upload media.{" "}
      <Link
        href={GALLERY_CATEGORIES_PATH}
        className="font-medium text-gold underline underline-offset-2"
      >
        Create or activate categories
      </Link>
      .
    </div>
  );
}
