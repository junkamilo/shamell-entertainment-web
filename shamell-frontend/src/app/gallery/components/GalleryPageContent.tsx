"use client";

import { useGalleryPage } from "../hooks/useGalleryPage";
import { GalleryFilterTabs } from "./GalleryFilterTabs";
import { GalleryGrid } from "./GalleryGrid";
import { GalleryHero } from "./GalleryHero";

export function GalleryPageContent() {
  const { currentFilter, categories, photos, isLoading } = useGalleryPage();

  return (
    <section className="px-4 pb-16 pt-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <GalleryHero />
        <GalleryFilterTabs categories={categories} currentFilter={currentFilter} />
        <GalleryGrid photos={photos} isLoading={isLoading} />
      </div>
    </section>
  );
}
