"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import RevealOnView from "@/components/shared/RevealOnView";
import { useGalleryCategories, useGalleryPhotos } from "@/hooks/use-gallery";
import { cn } from "@/lib/utils";

function cellLayoutClass(index: number) {
  if (index < 2) {
    return "col-span-1 md:col-span-3";
  }
  if (index < 5) {
    return "col-span-1 md:col-span-2";
  }
  return "col-span-2 flex justify-center md:col-span-6";
}

const GallerySection = () => {
  const [filter, setFilter] = useState("all");
  const { categories } = useGalleryCategories();
  const { photos, isLoading } = useGalleryPhotos(filter, 6);

  return (
    <section id="gallery" className="bg-transparent px-4 py-20">
      <div className="relative mx-auto mb-10 max-w-6xl text-center">
        <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2">
          <div className="h-32 w-[min(26rem,92vw)] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(197,165,90,0.1),transparent_75%)] blur-3xl opacity-75" />
        </div>
        <RevealOnView className="relative" delay={40}>
          <h2 className="mb-3 text-center font-brand text-2xl font-semibold tracking-wider text-gold md:text-3xl">
            Performance Gallery
          </h2>
          <p className="mx-auto mb-2 max-w-2xl text-center font-body text-base font-medium leading-relaxed text-foreground/88 md:text-lg md:leading-relaxed md:text-foreground/90">
            Visual portfolio organized by performance type. Tap any image for full-screen view.
          </p>
        </RevealOnView>
      </div>

      <div className="mx-auto max-w-6xl">

        <RevealOnView delay={120} amount={0.16}>
          <div
            role="tablist"
            aria-label="Gallery filters"
            className="mb-10 flex flex-wrap justify-center gap-2"
          >
            {categories.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filter === tab.id}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "border px-3 py-2 font-brand text-xs font-semibold tracking-[0.12em] transition-colors",
                  filter === tab.id
                    ? "border-gold bg-gold/15 text-gold"
                    : "border-gold/30 text-foreground/70 hover:border-gold/50 hover:text-gold",
                )}
              >
                {tab.label.toUpperCase()}
              </button>
            ))}
          </div>
        </RevealOnView>

        {isLoading ? (
          <p className="mb-6 text-center font-body text-base font-medium text-foreground/85 md:text-lg md:text-foreground/88">Loading gallery...</p>
        ) : null}

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-6 md:gap-5">
          {photos.slice(0, 6).map((item, index) => (
            <RevealOnView
              key={item.id}
              className={cn("group relative", cellLayoutClass(index), index === 5 && "md:justify-center")}
              delay={index * 70}
              amount={0.14}
            >
              <div
                className={cn(
                  "shamell-gallery-card-bg relative aspect-3/4 w-full overflow-hidden rounded-2xl border border-gold/15 shadow-[inset_0_1px_0_rgba(197,165,90,0.06),inset_0_0_0_1px_rgba(255,255,255,0.04),0_12px_40px_rgba(0,0,0,0.38)] transition-[border-color,box-shadow] duration-500",
                  "group-hover:border-gold/35 group-hover:shadow-[0_20px_52px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(197,165,90,0.1),inset_0_0_0_1px_rgba(255,255,255,0.06)]",
                  index === 5 && "mx-auto max-w-sm md:max-w-md",
                )}
              >
                <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(42,32,26,0.2),transparent_38%,transparent_62%,rgba(24,18,14,0.25))] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                {item.mediaType === "VIDEO" ? (
                  <video
                    src={item.src}
                    className="h-full w-full object-contain object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
                    loading="lazy"
                    className="object-contain object-center p-2 transition-transform duration-700 ease-out group-hover:scale-[1.02] sm:p-2.5 md:p-3"
                  />
                )}

                <span
                  className="pointer-events-none absolute left-2 top-2 h-5 w-5 border-l border-t border-gold/25 opacity-50 transition-opacity group-hover:opacity-90"
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute right-2 top-2 h-5 w-5 border-r border-t border-gold/25 opacity-50 transition-opacity group-hover:opacity-90"
                  aria-hidden
                />
              </div>
            </RevealOnView>
          ))}
        </div>

        <RevealOnView className="mt-12 flex justify-center" delay={120} amount={0.2}>
          <Link href={`/gallery?filter=${filter}`} className="btn-outline-gold font-brand md:text-xs">
            View more
          </Link>
        </RevealOnView>
      </div>
    </section>
  );
};

export default GallerySection;
