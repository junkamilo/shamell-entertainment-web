/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useHeaderText } from "@/hooks/use-header-text";
import { fontClassForToken } from "@/lib/headerTextStyleTokens";
import type { HeaderTextContent } from "@/lib/headerTextTypes";
import { buildHeroWaveClipPathD } from "@/lib/heroPearlWave";
import { cn } from "@/lib/utils";
import HeroFallbackBackground from "./HeroFallbackBackground";
import {
  normalizeHeaderPhotos,
  type PublicHeaderPhoto,
} from "@/lib/fetchPublicHeaderMedia";

const heroWaveClipPathId = "shamell-hero-wave-clip";
const heroClipPath = `url(#${heroWaveClipPathId})`;

function clampPercent(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Build a Cloudinary width-descriptor srcset from a mobile/desktop pair. */
function buildSrcSet(
  mobileUrl: string | null,
  desktopUrl: string | null,
  mobileW: number,
  desktopW: number,
): string | undefined {
  const parts = [
    mobileUrl ? `${mobileUrl} ${mobileW}w` : null,
    desktopUrl ? `${desktopUrl} ${desktopW}w` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : undefined;
}

/** Build inline CSS vars so a single element can switch object-position per breakpoint. */
function heroFocalStyle(
  desktopPosition: string,
  mobilePosition: string,
): CSSProperties {
  return {
    ["--hero-focal" as string]: desktopPosition,
    ["--hero-focal-mobile" as string]: mobilePosition,
  };
}

/** Deferred hero video: poster is the LCP image; <video> fades in once playable. */
function HeroSlideVideo({
  photo,
  isFirst,
  canPlay,
  desktopPosition,
  mobilePosition,
}: {
  photo: PublicHeaderPhoto;
  isFirst: boolean;
  canPlay: boolean;
  desktopPosition: string;
  mobilePosition: string;
}) {
  const [videoReady, setVideoReady] = useState(false);
  const posterSrc = photo.videoPosterUrl ?? photo.videoPosterUrlMobile;
  const posterSrcSet = buildSrcSet(
    photo.videoPosterUrlMobile,
    photo.videoPosterUrl,
    480,
    720,
  );
  const focalStyle = heroFocalStyle(desktopPosition, mobilePosition);

  return (
    <div className="absolute inset-0">
      {posterSrc ? (
        <img
          src={posterSrc}
          srcSet={posterSrcSet}
          sizes="100vw"
          alt=""
          fetchPriority={isFirst ? "high" : "auto"}
          loading={isFirst ? "eager" : "lazy"}
          decoding="async"
          className={cn(
            "hero-focal-img absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
            videoReady ? "opacity-0" : "opacity-100",
          )}
          style={focalStyle}
          aria-hidden
        />
      ) : null}
      {canPlay && photo.videoDeliveryUrl ? (
        <video
          src={photo.videoDeliveryUrl}
          className={cn(
            "hero-focal-img absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
            videoReady ? "opacity-100" : "opacity-0",
          )}
          style={focalStyle}
          muted
          playsInline
          loop
          autoPlay
          preload={isFirst ? "metadata" : "none"}
          onCanPlay={() => setVideoReady(true)}
          onPlaying={() => setVideoReady(true)}
          aria-hidden
        />
      ) : null}
    </div>
  );
}

/**
 * Responsive hero image: a single <img> with a Cloudinary srcset (served
 * straight from the CDN). Per-device focal point is preserved via CSS vars
 * (`--hero-focal` / `--hero-focal-mobile`) consumed by `.hero-focal-img`.
 */
function HeroSlideImage({
  photo,
  isFirst,
  desktopPosition,
  mobilePosition,
}: {
  photo: PublicHeaderPhoto;
  isFirst: boolean;
  desktopPosition: string;
  mobilePosition: string;
}) {
  const src = photo.imageUrl ?? photo.imageUrlMobile;
  if (!src) return null;
  return (
    <img
      src={src}
      srcSet={buildSrcSet(photo.imageUrlMobile, photo.imageUrl, 960, 1920)}
      sizes="100vw"
      alt=""
      fetchPriority={isFirst ? "high" : "auto"}
      loading={isFirst ? "eager" : "lazy"}
      decoding={isFirst ? "sync" : "async"}
      className="hero-focal-img absolute inset-0 h-full w-full object-cover"
      style={heroFocalStyle(desktopPosition, mobilePosition)}
    />
  );
}

type HeroSectionProps = {
  initialPhotos?: PublicHeaderPhoto[];
  initialHeaderText?: HeaderTextContent | null;
};

const HeroSection = ({
  initialPhotos = [],
  initialHeaderText,
}: HeroSectionProps) => {
  const { content: headerText } = useHeaderText(initialHeaderText);
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
    [],
  );
  const [photos, setPhotos] = useState<PublicHeaderPhoto[]>(initialPhotos);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () =>
      setPrefersReducedMotion(mediaQuery.matches);

    syncMotionPreference();
    mediaQuery.addEventListener("change", syncMotionPreference);

    return () => {
      mediaQuery.removeEventListener("change", syncMotionPreference);
    };
  }, []);

  useEffect(() => {
    if (initialPhotos.length > 0) return;
    const load = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/header-media`, {
          next: { revalidate: 120 },
        });
        if (!response.ok) return;
        const data = await response.json().catch(() => []);
        const items = normalizeHeaderPhotos(data);
        if (items.length) setPhotos(items);
      } catch {
        // Keep fallback background when API is unavailable.
      }
    };
    void load();
  }, [apiBaseUrl, initialPhotos.length]);

  useEffect(() => {
    if (photos.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % photos.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [photos.length]);

  const hasRemotePhotos = photos.length > 0;
  const activePhoto = hasRemotePhotos
    ? photos[activeIndex % photos.length]
    : null;
  const animateVisuals = hasHydrated && !prefersReducedMotion;

  return (
    <section id="hero" className="relative bg-transparent">
      <div className="relative flex min-h-svh flex-col overflow-hidden">
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
          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={hasHydrated ? { opacity: 1 } : { opacity: 0 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { duration: 1.15, ease: [0.16, 1, 0.3, 1] }
            }
          >
            <div className="absolute -inset-y-28 left-0 right-0 min-h-full min-w-full">
              <div className="absolute inset-0">
                {hasRemotePhotos ? (
                  <div className="relative h-full w-full">
                    <AnimatePresence mode="sync">
                      {activePhoto ? (
                        <motion.div
                          key={`${activePhoto.id}-${activeIndex}`}
                          className="absolute inset-0"
                          initial={animateVisuals ? { opacity: 0 } : { opacity: 1 }}
                          animate={{ opacity: 1 }}
                          exit={animateVisuals ? { opacity: 0 } : { opacity: 0 }}
                          transition={{
                            duration: 0.9,
                            ease: "easeOut",
                          }}
                        >
                          <div className="absolute inset-0">
                            {(() => {
                              const desktopX = clampPercent(
                                activePhoto.focalX,
                                50,
                              );
                              const desktopY = clampPercent(
                                activePhoto.focalY,
                                35,
                              );
                              const desktopPosition = `${desktopX}% ${desktopY}%`;
                              const mobilePosition = `${clampPercent(activePhoto.focalMobileX, desktopX)}% ${clampPercent(activePhoto.focalMobileY, desktopY)}%`;
                              return activePhoto.mediaType === "VIDEO" ? (
                                <HeroSlideVideo
                                  photo={activePhoto}
                                  isFirst={activeIndex === 0}
                                  canPlay={animateVisuals}
                                  desktopPosition={desktopPosition}
                                  mobilePosition={mobilePosition}
                                />
                              ) : (
                                <HeroSlideImage
                                  photo={activePhoto}
                                  isFirst={activeIndex === 0}
                                  desktopPosition={desktopPosition}
                                  mobilePosition={mobilePosition}
                                />
                              );
                            })()}
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="absolute inset-0">
                    <HeroFallbackBackground />
                  </div>
                )}
              </div>
            </div>

            <div
              className="absolute inset-0 bg-linear-to-b from-black/75 via-black/25 to-black/88"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-black opacity-[0.15]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_65%_at_50%_38%,rgba(0,0,0,0.15)_0%,transparent_55%,rgba(0,0,0,0.55)_100%)]"
              aria-hidden
            />
          </motion.div>
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-36 pt-24 sm:px-8 sm:pb-40 sm:pt-28 md:px-10">
          <div className="relative w-full max-w-xl text-center md:max-w-3xl lg:max-w-4xl">
            <div className="relative px-2 sm:px-6 md:px-10">
              <div className="shamell-hero-enter shamell-hero-enter--d1 mb-5 flex justify-center md:mb-6">
                <img
                  src="/01_bailarina.png"
                  alt="Shamell"
                  fetchPriority="high"
                  decoding="async"
                  className="h-12 w-auto max-w-[min(100%,7rem)] object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:h-14 sm:max-w-[min(100%,8rem)]"
                />
              </div>

              <h1
                className={cn(
                  "shamell-hero-enter shamell-hero-enter--d2 mb-4 text-4xl tracking-[0.28em] drop-shadow-[0_4px_28px_rgba(0,0,0,0.65)] sm:text-5xl sm:tracking-[0.26em] md:mb-5 md:text-6xl md:tracking-[0.24em] lg:text-7xl",
                  fontClassForToken(headerText.headlineFont),
                )}
                style={{ color: headerText.headlineColor }}
              >
                {headerText.headline}
              </h1>

              <p
                className={cn(
                  "shamell-hero-enter shamell-hero-enter--d3 mx-auto mb-10 max-w-lg font-medium italic leading-relaxed tracking-wide sm:mb-12 sm:max-w-xl sm:text-2xl sm:leading-relaxed md:max-w-2xl md:text-3xl md:leading-snug lg:text-4xl",
                  fontClassForToken(headerText.taglineFont),
                  "text-xl",
                )}
                style={{ color: headerText.taglineColor }}
              >
                {headerText.tagline}
              </p>

              <div className="shamell-hero-enter shamell-hero-enter--d4 mx-auto w-full max-w-md md:max-w-xl">
                <div className="rounded-2xl border border-white/12 bg-black/35 px-5 py-6 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-md sm:px-8 sm:py-7 md:rounded-3xl md:px-10 md:py-8">
                  <p
                    className={cn(
                      "text-2xl leading-snug drop-shadow-[0_2px_16px_rgba(0,0,0,0.5)] sm:text-3xl md:text-[2.1rem] md:leading-tight",
                      fontClassForToken(headerText.quoteFont),
                    )}
                    style={{ color: headerText.quoteColor }}
                  >
                    {headerText.quote}
                    <span className="ml-2 inline-block h-2 w-2 rounded-full bg-gold-light align-middle opacity-90" />
                  </p>

                  <div className="mt-6 flex flex-col items-stretch gap-4 sm:mt-7 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
                    <span
                      className="hidden h-px w-16 shrink-0 bg-linear-to-r from-transparent to-gold/50 sm:block md:w-20"
                      aria-hidden
                    />
                    <a
                      href="/contacto"
                      className="group relative inline-flex min-h-11 items-center justify-center gap-2 self-center border border-gold/55 px-8 py-2.5 font-brand text-xs font-semibold tracking-[0.22em] text-gold uppercase transition-all duration-300 hover:border-gold hover:bg-gold/8 hover:text-gold-light hover:shadow-[0_0_28px_rgba(197,165,90,0.2)] sm:min-h-12 sm:px-10 sm:tracking-[0.26em] md:tracking-[0.28em]"
                    >
                      <span
                        className="absolute inset-0 -z-10 bg-linear-to-r from-transparent via-white/6 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        aria-hidden
                      />
                      Inquire
                    </a>
                    <span
                      className="hidden h-px w-16 shrink-0 bg-linear-to-l from-transparent to-gold/50 sm:block md:w-20"
                      aria-hidden
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
