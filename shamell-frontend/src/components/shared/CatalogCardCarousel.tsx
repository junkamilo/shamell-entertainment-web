"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { CatalogSlideProvider } from "./catalog-slide-context";
import { resolveCarouselLayout } from "./catalog-carousel-layout";

const DEFAULT_MAX_VISIBLE_DESKTOP = 3;

type CatalogCardCarouselProps = {
  children: ReactNode;
  /** Accessible name for the carousel region. */
  ariaLabel: string;
  className?: string;
  /** Maximum cards visible on xl+ (default 3). */
  visibleOnDesktop?: number;
};

function useScrollEdges(scrollerRef: React.RefObject<HTMLDivElement | null>) {
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(maxScroll <= 4 || el.scrollLeft >= maxScroll - 4);
  }, [scrollerRef]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      ro.disconnect();
    };
  }, [sync, scrollerRef]);

  return { atStart, atEnd, sync };
}

/** Reports intersection ratio to parent for swipe-rail active slide detection. */
function CatalogCarouselSlide({
  slideIndex,
  trackVisibility,
  className,
  style,
  children,
}: {
  slideIndex: number;
  trackVisibility: (index: number, ratio: number) => void;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      trackVisibility(slideIndex, 1);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) trackVisibility(slideIndex, entry.intersectionRatio);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [slideIndex, trackVisibility]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

const navButtonClass = cn(
  "absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gold/35 bg-black/55 text-gold shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-sm transition",
  "hover:border-gold/55 hover:bg-black/70 hover:text-gold-light",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/60",
  "disabled:pointer-events-none disabled:opacity-35",
  "motion-reduce:transition-none",
);

/**
 * Horizontal catalog rail: 1 card below lg, 2 at lg–xl, 3 at xl+.
 * Touch scroll on mobile/tablet; prev/next arrows when more items than fit.
 */
export default function CatalogCardCarousel({
  children,
  ariaLabel,
  className,
  visibleOnDesktop = DEFAULT_MAX_VISIBLE_DESKTOP,
}: CatalogCardCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isLgUp = useMediaQuery("(min-width: 1024px)");
  const isXlUp = useMediaQuery("(min-width: 1280px)");
  const { atStart, atEnd, sync } = useScrollEdges(scrollerRef);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const visibilityRef = useRef<Map<number, number>>(new Map());

  const layout = useMemo(
    () => resolveCarouselLayout(isLgUp, isXlUp, visibleOnDesktop),
    [isLgUp, isXlUp, visibleOnDesktop],
  );

  const trackVisibility = useCallback((index: number, ratio: number) => {
    visibilityRef.current.set(index, ratio);
    let bestIndex = 0;
    let bestRatio = 0;
    visibilityRef.current.forEach((r, i) => {
      if (r > bestRatio) {
        bestRatio = r;
        bestIndex = i;
      }
    });
    setActiveSlideIndex(bestIndex);
  }, []);

  const items = Children.toArray(children).filter(isValidElement);
  const count = items.length;
  const horizontalRail = count > 1;
  const showArrows =
    isLgUp && !layout.useSwipeRail && count > layout.visibleCount;
  const enableSlideActive = layout.useSwipeRail;

  const scrollByPage = useCallback(
    (direction: -1 | 1) => {
      const el = scrollerRef.current;
      if (!el) return;
      const gap = layout.gapPx;
      const slideWidth = layout.useSwipeRail
        ? el.clientWidth * 0.88 + gap
        : (el.clientWidth - gap * (layout.visibleCount - 1)) / layout.visibleCount +
          gap;
      el.scrollBy({ left: direction * slideWidth, behavior: "smooth" });
      window.setTimeout(sync, 400);
    },
    [layout, sync],
  );

  if (count === 0) return null;

  return (
    <div className={cn("relative", showArrows && "lg:px-12", className)}>
      {showArrows ? (
        <>
          <button
            type="button"
            className={cn(navButtonClass, "left-0 -translate-x-1/2 lg:left-2 lg:translate-x-0")}
            onClick={() => scrollByPage(-1)}
            disabled={atStart}
            aria-label="Previous cards"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            className={cn(navButtonClass, "right-0 translate-x-1/2 lg:right-2 lg:translate-x-0")}
            onClick={() => scrollByPage(1)}
            disabled={atEnd}
            aria-label="Next cards"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </>
      ) : null}

      <div
        ref={scrollerRef}
        role="region"
        aria-label={ariaLabel}
        aria-roledescription={horizontalRail ? "carousel" : undefined}
        tabIndex={horizontalRail ? 0 : undefined}
        onKeyDown={(e) => {
          if (!horizontalRail) return;
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            scrollByPage(-1);
          }
          if (e.key === "ArrowRight") {
            e.preventDefault();
            scrollByPage(1);
          }
        }}
        className={cn(
          "flex items-stretch gap-6 pb-2 lg:gap-8",
          horizontalRail
            ? "snap-x snap-mandatory overflow-x-auto overscroll-x-contain shamell-scrollbar [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] max-lg:px-1"
            : "flex-row flex-nowrap justify-center",
        )}
      >
        {items.map((child, index) => {
          const slideClass = cn(
            "catalog-carousel-slide min-w-0 shrink-0",
            horizontalRail && "snap-start snap-always",
            layout.useSwipeRail
              ? "w-[min(88vw,26rem)]"
              : "lg:w-auto lg:max-w-none lg:flex-[0_0_auto]",
            !horizontalRail && "w-full max-w-[min(100%,17.5rem)]",
          );
          const slideStyle =
            horizontalRail && !layout.useSwipeRail
              ? {
                  flexBasis: layout.slideBasis,
                  width: layout.slideBasis,
                  maxWidth: layout.slideBasis,
                }
              : layout.useSwipeRail
                ? { width: layout.slideBasis, maxWidth: layout.slideBasis }
                : undefined;

          const isActive = enableSlideActive && index === activeSlideIndex;

          return (
            <CatalogCarouselSlide
              key={child.key ?? `catalog-slide-${index}`}
              slideIndex={index}
              trackVisibility={enableSlideActive ? trackVisibility : () => undefined}
              className={slideClass}
              style={slideStyle}
            >
              <CatalogSlideProvider isActive={isActive}>
                {child}
              </CatalogSlideProvider>
            </CatalogCarouselSlide>
          );
        })}
      </div>

      {layout.useSwipeRail && horizontalRail ? (
        <p className="mt-3 text-center font-body text-xs text-foreground/55 lg:hidden">
          Swipe sideways to see more
        </p>
      ) : null}
    </div>
  );
}
