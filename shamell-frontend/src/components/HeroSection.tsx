/* eslint-disable @next/next/no-img-element */
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buildHeroWaveClipPathD } from "@/lib/heroPearlWave";
import HeroFallbackBackground from "./HeroFallbackBackground";
import FlameIcon from "./FlameIcon";
import PearlDivider from "./PearlDivider";

const heroWaveClipPathId = "shamell-hero-wave-clip";
const heroClipPath = `url(#${heroWaveClipPathId})`;

const HeroSection = () => {
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
    [],
  );
  const [photos, setPhotos] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/header-media`, {
          cache: "no-store",
        });
        const data = await response.json().catch(() => []);
        if (!response.ok || !Array.isArray(data)) return;
        const urls = data
          .map((item) =>
            typeof item?.imageUrl === "string" ? item.imageUrl.trim() : "",
          )
          .filter(Boolean);
        setPhotos(urls);
      } catch {
        // Keep fallback background when API is unavailable.
      }
    };
    void load();
  }, [apiBaseUrl]);

  useEffect(() => {
    if (photos.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % photos.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [photos.length]);

  const hasRemotePhotos = photos.length > 0;
  const canSlide = photos.length > 1;

  const onPrev = () => {
    if (!canSlide) return;
    setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const onNext = () => {
    if (!canSlide) return;
    setActiveIndex((prev) => (prev + 1) % photos.length);
  };

  return (
    <section
      id="hero"
      className="relative flex min-h-svh flex-col overflow-hidden bg-transparent"
    >
      <svg
        width={0}
        height={0}
        className="absolute overflow-hidden"
        aria-hidden
      >
        <defs>
          <clipPath id={heroWaveClipPathId} clipPathUnits="objectBoundingBox">
            <path d={buildHeroWaveClipPathD()} />
          </clipPath>
        </defs>
      </svg>

      <div
        className="absolute inset-0"
        style={{
          clipPath: heroClipPath,
          WebkitClipPath: heroClipPath,
        }}
      >
        <div className="shamell-hero-ken absolute inset-0 min-h-full min-w-full">
          {hasRemotePhotos ? (
            <div className="relative h-full w-full">
              {photos.map((url, index) => (
                <img
                  key={`${url}-${index}`}
                  src={url}
                  alt=""
                  className={`hero-zoom absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                    index === activeIndex ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
            </div>
          ) : (
            <HeroFallbackBackground />
          )}
        </div>

        <div
          className="absolute inset-0 bg-linear-to-b from-black/75 via-black/25 to-black/88"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_65%_at_50%_38%,rgba(0,0,0,0.15)_0%,transparent_55%,rgba(0,0,0,0.55)_100%)]"
          aria-hidden
        />
      </div>

      {canSlide ? (
        <div className="absolute inset-x-0 bottom-24 z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-4 sm:px-6 md:bottom-28">
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/45 bg-black/35 text-gold transition hover:border-gold hover:bg-gold/10"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onNext}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/45 bg-black/35 text-gold transition hover:border-gold hover:bg-gold/10"
            aria-label="Foto siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      ) : null}

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-36 pt-24 sm:px-8 sm:pb-40 sm:pt-28 md:px-10">
        <div className="relative w-full max-w-xl text-center md:max-w-3xl lg:max-w-4xl">
          <div
            className="pointer-events-none absolute -left-1 -top-1 h-10 w-10 border-l border-t border-gold/45 sm:h-12 sm:w-12 md:-left-2 md:-top-2 md:h-14 md:w-14"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-1 -top-1 h-10 w-10 border-r border-t border-gold/45 sm:h-12 sm:w-12 md:-right-2 md:-top-2 md:h-14 md:w-14"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-1 -left-1 h-10 w-10 border-b border-l border-gold/35 sm:h-12 sm:w-12 md:-bottom-2 md:-left-2 md:h-14 md:w-14"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-1 -right-1 h-10 w-10 border-b border-r border-gold/35 sm:h-12 sm:w-12 md:-bottom-2 md:-right-2 md:h-14 md:w-14"
            aria-hidden
          />

          <div className="absolute -left-px top-[18%] hidden h-28 w-px bg-linear-to-b from-gold/10 via-gold/50 to-gold/10 md:block lg:top-[22%] lg:h-32" aria-hidden />

          <div className="relative px-2 sm:px-6 md:px-10">
            <div className="shamell-hero-enter shamell-hero-enter--d1 mb-5 flex justify-center md:mb-6">
              <FlameIcon className="h-12 w-9 text-gold drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:h-14 sm:w-10" />
            </div>

            <h1 className="shamell-hero-enter shamell-hero-enter--d2 mb-4 font-brand text-4xl tracking-[0.28em] text-gold drop-shadow-[0_4px_28px_rgba(0,0,0,0.65)] sm:text-5xl sm:tracking-[0.26em] md:mb-5 md:text-6xl md:tracking-[0.24em] lg:text-7xl">
              SHAMELL
            </h1>

            <p className="shamell-hero-enter shamell-hero-enter--d3 mx-auto mb-10 max-w-md font-elegant text-base italic leading-relaxed tracking-wide text-gold-light/95 sm:mb-12 sm:text-lg md:max-w-lg md:text-xl">
              Exclusive Performance Artistry
            </p>

            <div className="shamell-hero-enter shamell-hero-enter--d4 mx-auto w-full max-w-md md:max-w-xl">
              <div className="rounded-2xl border border-white/12 bg-black/35 px-5 py-6 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-md sm:px-8 sm:py-7 md:rounded-3xl md:px-10 md:py-8">
                <p className="font-script text-2xl leading-snug text-gold drop-shadow-[0_2px_16px_rgba(0,0,0,0.5)] sm:text-3xl md:text-[2.1rem] md:leading-tight">
                  Dance is the hidden language of the soul.
                  <span className="ml-2 inline-block h-2 w-2 rounded-full bg-gold-light align-middle opacity-90" />
                </p>

                <div className="mt-6 flex flex-col items-stretch gap-4 sm:mt-7 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
                  <span
                    className="hidden h-px w-16 shrink-0 bg-linear-to-r from-transparent to-gold/50 sm:block md:w-20"
                    aria-hidden
                  />
                  <a
                    href="/contacto"
                    className="group relative inline-flex min-h-11 items-center justify-center gap-2 self-center border border-gold/55 px-8 py-2.5 font-brand text-[10px] tracking-[0.26em] text-gold uppercase transition-all duration-300 hover:border-gold hover:bg-gold/8 hover:text-gold-light hover:shadow-[0_0_28px_rgba(197,165,90,0.2)] sm:min-h-12 sm:px-10 sm:text-xs sm:tracking-[0.28em]"
                  >
                    <span className="absolute inset-0 -z-10 bg-linear-to-r from-transparent via-white/6 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
                    Inquire
                  </a>
                  <span
                    className="hidden h-px w-16 shrink-0 bg-linear-to-l from-transparent to-gold/50 sm:block md:w-20"
                    aria-hidden
                  />
                </div>
              </div>
            </div>

            <p className="shamell-hero-enter shamell-hero-enter--d5 mt-5 text-center font-brand text-[9px] tracking-[0.35em] text-foreground/40 uppercase sm:mt-6 sm:text-[10px]">
              Private events · International
            </p>
          </div>
        </div>
      </div>

      <PearlDivider variant="hero" />
    </section>
  );
};

export default HeroSection;
