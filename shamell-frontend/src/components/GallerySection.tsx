"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useGalleryCategories, useGalleryPhotos } from "@/hooks/use-gallery";

const GallerySection = () => {
  const [filter, setFilter] = useState("all");
  const { categories } = useGalleryCategories();
  const { photos, isLoading } = useGalleryPhotos(filter, 6);

  return (
    <section id="gallery" className="bg-background py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-brand text-gold text-center text-2xl md:text-3xl tracking-wider mb-3">
          Performance Gallery
        </h2>
        <p className="text-foreground/60 text-sm text-center mb-8 font-body max-w-2xl mx-auto">
          Visual portfolio organized by performance type. Tap any image for full-screen view.
        </p>

        {/* Filter tabs */}
        <div
          role="tablist"
          aria-label="Gallery filters"
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {categories.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={filter === tab.id}
              onClick={() => setFilter(tab.id)}
              className={`font-brand text-[10px] md:text-xs tracking-[0.12em] px-3 py-2 border transition-colors ${
                filter === tab.id
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-gold/30 text-foreground/70 hover:border-gold/50 hover:text-gold"
              }`}
            >
              {tab.label.toUpperCase()}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="mb-6 text-center text-sm text-foreground/60">Loading gallery...</p>
        ) : null}

        <div className="grid grid-cols-6 gap-4">
          {photos.slice(0, 6).map((item, index) => (
            <div
              key={item.id}
              className={`group relative overflow-hidden border border-gold/25 min-h-[180px] md:min-h-[220px] ${
                index < 2 ? "col-span-3" : index < 5 ? "col-span-2" : "col-span-6 md:col-span-2 md:col-start-3"
              }`}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                loading="lazy"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link href={`/gallery?filter=${filter}`} className="btn-outline-gold font-brand text-xs">
            Ver mas
          </Link>
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
