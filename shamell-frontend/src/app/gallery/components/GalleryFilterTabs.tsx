"use client";

import Link from "next/link";
import { buildGalleryFilterHref } from "../lib/galleryRoutes";
import type { GalleryTabItem } from "../types/gallery.types";

type GalleryFilterTabsProps = {
  categories: GalleryTabItem[];
  currentFilter: string;
};

export function GalleryFilterTabs({ categories, currentFilter }: GalleryFilterTabsProps) {
  return (
    <div className="mb-10 flex flex-wrap justify-center gap-2">
      {categories.map((tab) => (
        <Link
          key={tab.id}
          href={buildGalleryFilterHref(tab.id)}
          className={`font-brand border px-3 py-2 text-[10px] tracking-[0.12em] transition-colors md:text-xs ${
            currentFilter === tab.id
              ? "border-gold bg-gold/15 text-gold"
              : "border-gold/30 text-foreground/70 hover:border-gold/50 hover:text-gold"
          }`}
        >
          {tab.label.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
