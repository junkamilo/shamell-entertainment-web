"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { useGalleryCategories, useGalleryPhotos } from "@/hooks/use-gallery";

function GalleryPageContent() {
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get("filter") ?? "all";
  const { categories } = useGalleryCategories();
  const { photos, isLoading } = useGalleryPhotos(currentFilter);

  return (
    <main className="bg-background min-h-screen">
      <SiteHeader />
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-brand text-gold text-center text-2xl md:text-4xl tracking-[0.2em] mb-4">
            GALLERY
          </h1>

          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((tab) => (
              <Link
                key={tab.id}
                href={`/gallery?filter=${tab.id}`}
                className={`font-brand text-[10px] md:text-xs tracking-[0.12em] px-3 py-2 border transition-colors ${
                  currentFilter === tab.id
                    ? "border-gold bg-gold/15 text-gold"
                    : "border-gold/30 text-foreground/70 hover:border-gold/50 hover:text-gold"
                }`}
              >
                {tab.label.toUpperCase()}
              </Link>
            ))}
          </div>

          {isLoading ? (
            <p className="mb-6 text-center text-sm text-foreground/60">Loading gallery...</p>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {photos.map((item) => (
              <div
                key={item.id}
                className="shamell-gallery-card-bg group relative aspect-3/4 overflow-hidden rounded-2xl border border-gold/15 shadow-[inset_0_1px_0_rgba(197,165,90,0.06),inset_0_0_0_1px_rgba(255,255,255,0.04),0_10px_36px_rgba(0,0,0,0.35)] transition-[border-color,box-shadow] duration-500 hover:border-gold/35 hover:shadow-[0_18px_48px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(197,165,90,0.09)] sm:aspect-3/4"
              >
                {item.mediaType === "VIDEO" ? (
                  <video
                    src={item.src}
                    className="h-full w-full object-contain object-center transition-transform duration-700 group-hover:scale-[1.02]"
                    controls
                    preload="metadata"
                  />
                ) : (
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    className="object-contain object-center p-2 transition-transform duration-700 group-hover:scale-[1.02] sm:p-3"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <GalleryPageContent />
    </Suspense>
  );
}
