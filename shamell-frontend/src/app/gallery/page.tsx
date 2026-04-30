"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { useGalleryCategories, useGalleryPhotos } from "@/hooks/use-gallery";

export default function GalleryPage() {
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((item) => (
              <div key={item.id} className="relative min-h-[230px] overflow-hidden border border-gold/25">
                <Image src={item.src} alt={item.alt} fill className="object-cover" sizes="33vw" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
