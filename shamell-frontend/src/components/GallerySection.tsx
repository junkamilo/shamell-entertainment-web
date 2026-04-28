"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Camera, X, ChevronLeft, ChevronRight } from "lucide-react";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import gallery5 from "@/assets/gallery-5.jpg";
import gallery6 from "@/assets/gallery-6.jpg";
import gallery7 from "@/assets/gallery-7.jpg";
import gallery8 from "@/assets/gallery-8.jpg";
import experienceFire from "@/assets/experience-fire.jpg";
import experienceVeil from "@/assets/experience-veil.jpg";
import experienceSword from "@/assets/experience-sword.jpg";
import type { StaticImageData } from "next/image";

type GalleryCategory = "fire" | "veil-fan" | "sword-candelabra" | "general";

type GalleryItem = {
  id: string;
  src: StaticImageData;
  alt: string;
  category: GalleryCategory;
  /** Taller items read more “masonry” in column layout */
  tall?: boolean;
};

const tabs: { id: GalleryCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "fire", label: "Fire Performance" },
  { id: "veil-fan", label: "Veil & Fan" },
  { id: "sword-candelabra", label: "Sword & Candelabra" },
  { id: "general", label: "General" },
];

const galleryItems: GalleryItem[] = [
  { id: "fire-1", src: experienceFire, alt: "Fire performance — Shamell", category: "fire", tall: true },
  { id: "fire-2", src: gallery5, alt: "Stage fire act", category: "fire" },
  { id: "veil-1", src: experienceVeil, alt: "Veil and fan dance", category: "veil-fan", tall: true },
  { id: "veil-2", src: gallery2, alt: "Veil movement", category: "veil-fan" },
  { id: "veil-3", src: gallery6, alt: "Fan choreography", category: "veil-fan" },
  { id: "sword-1", src: experienceSword, alt: "Sword and candelabra ritual", category: "sword-candelabra", tall: true },
  { id: "sword-2", src: gallery3, alt: "Ceremonial balance", category: "sword-candelabra" },
  { id: "sword-3", src: gallery7, alt: "Candle performance", category: "sword-candelabra" },
  { id: "gen-1", src: gallery1, alt: "Shamell performance portrait", category: "general", tall: true },
  { id: "gen-2", src: gallery4, alt: "Private event atmosphere", category: "general" },
  { id: "gen-3", src: gallery8, alt: "Gala performance moment", category: "general" },
];

const INSTAGRAM_PROFILE = "https://www.instagram.com/Shamellentertainment/";

const GallerySection = () => {
  const [filter, setFilter] = useState<GalleryCategory | "all">("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    setLightboxIndex(null);
  }, [filter]);

  const filtered = useMemo(
    () =>
      filter === "all" ? galleryItems : galleryItems.filter((item) => item.category === filter),
    [filter],
  );

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => {
      if (i === null || filtered.length === 0) return i;
      return (i - 1 + filtered.length) % filtered.length;
    });
  }, [filtered.length]);

  const goNext = useCallback(() => {
    setLightboxIndex((i) => {
      if (i === null || filtered.length === 0) return i;
      return (i + 1) % filtered.length;
    });
  }, [filtered.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, closeLightbox, goPrev, goNext]);

  const embedUrl = process.env.NEXT_PUBLIC_INSTAGRAM_EMBED_URL;

  useEffect(() => {
    if (!embedUrl || typeof window === "undefined") return;
    const existing = document.querySelector('script[src="https://www.instagram.com/embed.js"]');
    if (existing) {
      (window as unknown as { instgrm?: { Embeds: { process: () => void } } }).instgrm?.Embeds.process();
      return;
    }
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.instagram.com/embed.js";
    s.onload = () => {
      (window as unknown as { instgrm?: { Embeds: { process: () => void } } }).instgrm?.Embeds.process();
    };
    document.body.appendChild(s);
  }, [embedUrl]);

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
          {tabs.map((tab) => (
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

        {/* Masonry-style columns */}
        <div className="columns-2 md:columns-3 gap-4 [column-fill:balance]">
          {filtered.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openLightbox(index)}
              className={`group relative mb-4 block w-full break-inside-avoid overflow-hidden border border-gold/25 focus-visible:outline-2 focus-visible:outline-gold ${
                item.tall ? "min-h-[220px] md:min-h-[280px]" : "min-h-[160px] md:min-h-[200px]"
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
              <span className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>

        {/* Instagram integration */}
        <div className="mt-16 border border-gold/25 bg-black/20 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
            <div>
              <h3 className="font-brand text-gold text-xs tracking-[0.2em] mb-2">INSTAGRAM</h3>
              <p className="text-foreground/70 text-sm font-body max-w-xl">
                Latest reels and behind-the-scenes moments. Follow for real-time updates from
                performances and events.
              </p>
            </div>
            <a
              href={INSTAGRAM_PROFILE}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline-gold font-brand text-xs inline-flex items-center justify-center gap-2 shrink-0"
            >
              <Camera className="w-4 h-4" aria-hidden />
              @Shamellentertainment
            </a>
          </div>

          {embedUrl ? (
            <div className="instagram-embed-wrapper flex justify-center">
              <blockquote
                className="instagram-media"
                data-instgrm-permalink={embedUrl}
                data-instgrm-version="14"
                style={{
                  background: "transparent",
                  border: 0,
                  borderRadius: 3,
                  margin: "1px auto",
                  maxWidth: 540,
                  minWidth: 326,
                  padding: 0,
                  width: "99.375%",
                }}
              />
            </div>
          ) : (
            <p className="text-foreground/50 text-xs font-body text-center border border-gold/15 py-8 px-4">
              Optional: set{" "}
              <code className="text-gold/80">NEXT_PUBLIC_INSTAGRAM_EMBED_URL</code> to a post URL
              (e.g. <code className="text-gold/80">https://www.instagram.com/p/XXXX/</code>) to embed
              a featured reel or carousel here.
            </p>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && filtered[lightboxIndex] ? (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            className="absolute top-4 right-4 text-gold hover:text-gold-light p-2 z-10"
            aria-label="Close"
          >
            <X className="w-8 h-8" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 text-gold hover:text-gold-light p-2 z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-10 h-10 md:w-12 md:h-12" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 text-gold hover:text-gold-light p-2 z-10"
            aria-label="Next image"
          >
            <ChevronRight className="w-10 h-10 md:w-12 md:h-12" />
          </button>
          <div
            className="relative h-[min(85vh,900px)] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={filtered[lightboxIndex].src}
              alt={filtered[lightboxIndex].alt}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
          <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-foreground/60 font-body px-4">
            {filtered[lightboxIndex].alt} · Use arrow keys to navigate
          </p>
        </div>
      ) : null}
    </section>
  );
};

export default GallerySection;
