/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion } from "motion/react";
import { buildHeroWaveClipPathD } from "@/lib/heroPearlWave";
import { serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";
import HeroFallbackBackground from "./HeroFallbackBackground";
import FlameIcon from "./FlameIcon";

const heroWaveClipPathId = "shamell-hero-wave-clip";
const heroClipPath = `url(#${heroWaveClipPathId})`;

type HeaderHeroPhoto = {
  id: string;
  imageUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  focalX?: number;
  focalY?: number;
  focalMobileX?: number;
  focalMobileY?: number;
};

function clampPercent(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function headerHeroMediaType(
  imageUrl: string,
  raw: unknown,
): "IMAGE" | "VIDEO" {
  if (serviceCatalogMediaTypeFromUrl(imageUrl) === "VIDEO") return "VIDEO";
  if (raw === "VIDEO") return "VIDEO";
  return "IMAGE";
}

function HeroSlideMedia({
  url,
  isVideo,
  objectPosition,
  className,
}: {
  url: string;
  isVideo: boolean;
  objectPosition: string;
  className: string;
}) {
  if (isVideo) {
    return (
      <video
        src={url}
        className={className}
        style={{ objectPosition }}
        muted
        playsInline
        loop
        autoPlay
        aria-hidden
      />
    );
  }
  return (
    <img
      src={url}
      alt=""
      className={className}
      style={{ objectPosition }}
    />
  );
}

const HeroSection = () => {
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const heroPinRef = useRef<HTMLDivElement | null>(null);
  const heroContentRef = useRef<HTMLDivElement | null>(null);
  const heroDarkOverlayRef = useRef<HTMLDivElement | null>(null);
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
    [],
  );
  const [photos, setPhotos] = useState<HeaderHeroPhoto[]>([]);
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
    const load = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/header-media`, {
          cache: "no-store",
        });
        const data = await response.json().catch(() => []);
        if (!response.ok || !Array.isArray(data)) return;
        const items = data
          .map((item) => {
            const imageUrl =
              typeof item?.imageUrl === "string" ? item.imageUrl.trim() : "";
            if (!imageUrl) return null;
            return {
              id: typeof item?.id === "string" ? item.id : imageUrl,
              imageUrl,
              mediaType: headerHeroMediaType(imageUrl, item?.mediaType),
              focalX:
                typeof item?.focalX === "number" ? item.focalX : undefined,
              focalY:
                typeof item?.focalY === "number" ? item.focalY : undefined,
              focalMobileX:
                typeof item?.focalMobileX === "number"
                  ? item.focalMobileX
                  : undefined,
              focalMobileY:
                typeof item?.focalMobileY === "number"
                  ? item.focalMobileY
                  : undefined,
            } as HeaderHeroPhoto;
          })
          .filter((item) => item !== null) as HeaderHeroPhoto[];
        setPhotos(items);
      } catch {
        // Keep fallback background when API is unavailable.
      }
    };
    void load();
  }, [apiBaseUrl]);

  useLayoutEffect(() => {
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const section = heroSectionRef.current;
    const pin = heroPinRef.current;
    const content = heroContentRef.current;
    const darkOverlay = heroDarkOverlayRef.current;

    if (!section || !pin || !content || !darkOverlay) return;

    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      const reducedMotion = prefersReducedMotion || reducedMotionQuery.matches;

      gsap.set(content, { opacity: 1, y: 0, willChange: "transform, opacity" });
      gsap.set(darkOverlay, { opacity: 0.15 });

      mm.add("(max-width: 1023px)", () => {
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: pin,
            start: "top top",
            end: reducedMotion ? "+=38%" : "+=70%",
            scrub: reducedMotion ? 0.2 : 0.35,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        timeline
          .to(
            content,
            { opacity: 0, y: reducedMotion ? -18 : -38, ease: "none" },
            0,
          )
          .to(
            darkOverlay,
            { opacity: reducedMotion ? 0.3 : 0.5, ease: "none" },
            0,
          );

        return () => timeline.kill();
      });

      mm.add("(min-width: 1024px) and (max-width: 1535px)", () => {
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: pin,
            start: "top top",
            end: reducedMotion ? "+=45%" : "+=82%",
            scrub: reducedMotion ? 0.2 : 0.3,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        timeline
          .to(
            content,
            { opacity: 0, y: reducedMotion ? -24 : -52, ease: "none" },
            0,
          )
          .to(
            darkOverlay,
            { opacity: reducedMotion ? 0.34 : 0.6, ease: "none" },
            0,
          );

        return () => timeline.kill();
      });

      mm.add("(min-width: 1536px)", () => {
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: pin,
            start: "top top",
            end: reducedMotion ? "+=55%" : "+=110%",
            scrub: reducedMotion ? 0.25 : 0.35,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        timeline
          .to(
            content,
            { opacity: 0, y: reducedMotion ? -28 : -64, ease: "none" },
            0,
          )
          .to(
            darkOverlay,
            { opacity: reducedMotion ? 0.36 : 0.68, ease: "none" },
            0,
          );

        return () => timeline.kill();
      });
    }, section);

    return () => {
      mm.revert();
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (photos.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % photos.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [photos.length]);

  useEffect(() => {
    if (photos.length > 0) ScrollTrigger.refresh();
  }, [photos.length]);

  const hasRemotePhotos = photos.length > 0;
  const activePhoto = hasRemotePhotos
    ? photos[activeIndex % photos.length]
    : null;
  const animateVisuals = hasHydrated && !prefersReducedMotion;

  return (
    <section ref={heroSectionRef} id="hero" className="relative bg-transparent">
      <div
        ref={heroPinRef}
        className="relative flex min-h-svh flex-col overflow-hidden"
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
                            <HeroSlideMedia
                              url={activePhoto.imageUrl}
                              isVideo={activePhoto.mediaType === "VIDEO"}
                              objectPosition={`${clampPercent(activePhoto.focalX, 50)}% ${clampPercent(activePhoto.focalY, 35)}%`}
                              className="absolute inset-0 hidden h-full w-full object-cover md:block"
                            />
                            <HeroSlideMedia
                              url={activePhoto.imageUrl}
                              isVideo={activePhoto.mediaType === "VIDEO"}
                              objectPosition={`${clampPercent(activePhoto.focalMobileX, clampPercent(activePhoto.focalX, 50))}% ${clampPercent(activePhoto.focalMobileY, clampPercent(activePhoto.focalY, 35))}%`}
                              className="absolute inset-0 h-full w-full object-cover md:hidden"
                            />
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
              ref={heroDarkOverlayRef}
              className="pointer-events-none absolute inset-0 bg-black opacity-[0.15]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_65%_at_50%_38%,rgba(0,0,0,0.15)_0%,transparent_55%,rgba(0,0,0,0.55)_100%)]"
              aria-hidden
            />
          </motion.div>
        </div>

        <div
          ref={heroContentRef}
          className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-36 pt-24 sm:px-8 sm:pb-40 sm:pt-28 md:px-10"
        >
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

            <div
              className="absolute -left-px top-[18%] hidden h-28 w-px bg-linear-to-b from-gold/10 via-gold/50 to-gold/10 md:block lg:top-[22%] lg:h-32"
              aria-hidden
            />

            <div className="relative px-2 sm:px-6 md:px-10">
              <div className="shamell-hero-enter shamell-hero-enter--d1 mb-5 flex justify-center md:mb-6">
                <FlameIcon className="h-12 w-9 text-gold drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:h-14 sm:w-10" />
              </div>

              <h1 className="shamell-hero-enter shamell-hero-enter--d2 mb-4 font-brand text-4xl tracking-[0.28em] text-gold drop-shadow-[0_4px_28px_rgba(0,0,0,0.65)] sm:text-5xl sm:tracking-[0.26em] md:mb-5 md:text-6xl md:tracking-[0.24em] lg:text-7xl">
                SHAMELL
              </h1>

              <p className="shamell-hero-enter shamell-hero-enter--d3 mx-auto mb-10 max-w-md font-elegant text-lg font-medium italic leading-relaxed tracking-wide text-gold-light/95 sm:mb-12 sm:text-xl md:max-w-lg md:text-xl">
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
