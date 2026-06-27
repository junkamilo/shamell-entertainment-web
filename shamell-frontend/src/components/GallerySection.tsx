"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import RevealOnView from "@/components/shared/RevealOnView";
import RevealStaggerGrid from "@/components/shared/RevealStaggerGrid";
import { useGalleryCategories } from "@/app/gallery/hooks/useGalleryCategories";
import { useGalleryPhotos } from "@/app/gallery/hooks/useGalleryPhotos";
import type { GalleryPhotoItem } from "@/app/gallery/types/gallery.types";
import { useInViewLoad } from "@/hooks/use-in-view-load";
import { cn } from "@/lib/utils";

/** Home preview: brick layout 3 + 2 + 3 (mockup), up to 8 images; shorter rows when fewer photos. */
function brickRows<T>(items: T[]): T[][] {
  const slice = items.slice(0, 8);
  const rows: T[][] = [];
  let offset = 0;
  for (const rowSize of [3, 2, 3] as const) {
    if (offset >= slice.length) break;
    rows.push(slice.slice(offset, offset + rowSize));
    offset += rowSize;
  }
  return rows;
}

function galleryRowClass(rowLength: number) {
  return cn(
    "w-full min-w-0",
    rowLength === 3 &&
      "grid grid-cols-3 gap-2 sm:flex sm:flex-row sm:justify-center sm:gap-4 md:gap-5 lg:gap-6",
    rowLength === 2 &&
      "grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:justify-center sm:gap-4 md:gap-5 lg:gap-6",
    rowLength === 1 && "flex justify-center",
  );
}

function galleryCellClass(rowLength: number) {
  return cn(
    "min-w-0",
    rowLength === 3 && "w-full sm:w-44 sm:shrink-0 md:w-52 lg:w-56 xl:w-60",
    rowLength === 2 && "w-full sm:w-56 sm:shrink-0 md:w-60 lg:w-64",
    rowLength === 1 &&
      "w-full max-w-[min(100%,22rem)] px-0.5 sm:max-w-md sm:px-0 md:max-w-lg lg:max-w-xl",
  );
}

function GalleryPreviewTile({ item }: { item: GalleryPhotoItem }) {
  const { ref, inView } = useInViewLoad<HTMLDivElement>({ rootMargin: "200px" });
  const [hovered, setHovered] = useState(false);
  const isVideo = item.mediaType === "VIDEO";
  // Load the heavy <video> only when the tile is near the viewport AND hovered.
  const showVideo = isVideo && inView && hovered && Boolean(item.src);
  const posterSrc = item.posterUrl ?? (isVideo ? null : item.src);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "shamell-gallery-card-bg group relative aspect-3/4 w-full overflow-visible rounded-xl border border-gold/15 shadow-[inset_0_1px_0_rgba(197,165,90,0.06),inset_0_0_0_1px_rgba(255,255,255,0.04),0_8px_28px_rgba(0,0,0,0.35)] transition-[border-color,box-shadow] duration-500",
        "group-hover:border-gold/35 group-hover:shadow-[0_16px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(197,165,90,0.1),inset_0_0_0_1px_rgba(255,255,255,0.06)]",
      )}
    >
      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(42,32,26,0.2),transparent_38%,transparent_62%,rgba(24,18,14,0.25))] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {posterSrc ? (
        <Image
          src={posterSrc}
          alt={item.alt}
          fill
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 30vw, 440px"
          loading="lazy"
          className="rounded-xl object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
        />
      ) : null}

      {showVideo ? (
        <video
          key={item.id}
          src={item.src}
          className="absolute inset-0 z-1 h-full w-full rounded-xl object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-label={item.alt}
        />
      ) : null}

      <span
        className="pointer-events-none absolute left-1.5 top-1.5 h-4 w-4 border-l border-t border-gold/25 opacity-50 transition-opacity group-hover:opacity-90"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute right-1.5 top-1.5 h-4 w-4 border-r border-t border-gold/25 opacity-50 transition-opacity group-hover:opacity-90"
        aria-hidden
      />
    </div>
  );
}

const GallerySection = () => {
  const [filter, setFilter] = useState("all");
  const { ref, inView } = useInViewLoad<HTMLElement>();
  const { categories } = useGalleryCategories(inView);
  const { photos, isLoading } = useGalleryPhotos(filter, 8, inView);
  const previewPhotos = useMemo(() => photos.slice(0, 8), [photos]);
  const rows = useMemo(() => brickRows(previewPhotos), [previewPhotos]);

  return (
    <section ref={ref} id="gallery" className="bg-transparent px-4 py-20">
      <div className="relative mx-auto mb-10 max-w-6xl text-center">
        <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2">
          <div className="h-32 w-[min(26rem,92vw)] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(197,165,90,0.1),transparent_75%)] blur-3xl opacity-75" />
        </div>
        <RevealOnView className="relative" delay={40}>
          <h2 className="mb-4 font-brand text-2xl font-semibold tracking-[0.14em] text-gold md:mb-5 md:text-4xl md:tracking-[0.16em]">
            PERFORMANCE GALLERY
          </h2>
          <p className="mx-auto max-w-3xl text-center font-body text-lg font-medium leading-relaxed text-foreground/88 sm:text-xl sm:leading-relaxed md:text-2xl md:leading-[1.65] md:text-foreground/90">
            Visual portfolio organized by performance type. Tap any image for full-screen view.
          </p>
        </RevealOnView>
      </div>

      <div className="mx-auto max-w-7xl px-3 sm:px-4">
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
          <p className="mb-6 text-center font-body text-base font-medium text-foreground/85 md:text-lg md:text-foreground/88">
            Loading gallery...
          </p>
        ) : null}

        <RevealStaggerGrid
          className="mx-auto flex w-full max-w-full flex-col items-stretch gap-3 sm:max-w-2xl sm:items-center sm:gap-4 md:max-w-5xl md:gap-5 lg:max-w-6xl xl:gap-6"
          amount={0.14}
          itemClassNames={rows.map(() => "h-auto w-full")}
        >
          {rows.map((row) => (
            <div key={row.map((p) => p.id).join("-")} className={galleryRowClass(row.length)}>
              {row.map((item) => (
                <div key={item.id} className={galleryCellClass(row.length)}>
                  <GalleryPreviewTile item={item} />
                </div>
              ))}
            </div>
          ))}
        </RevealStaggerGrid>

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
