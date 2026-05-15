"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

const DEFAULT_VISIBLE_DESKTOP = 3;
const GAP_PX_MD = 32;

type CatalogCardCarouselProps = {
  children: ReactNode;
  /** Accessible name for the carousel region. */
  ariaLabel: string;
  className?: string;
  /** How many cards are fully visible on md+ before scrolling (default 3). */
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

const navButtonClass = cn(
  "absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gold/35 bg-black/55 text-gold shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-sm transition",
  "hover:border-gold/55 hover:bg-black/70 hover:text-gold-light",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/60",
  "disabled:pointer-events-none disabled:opacity-35",
  "motion-reduce:transition-none",
);

/**
 * Horizontal catalog rail: up to `visibleOnDesktop` cards on desktop; touch scroll on mobile.
 * Prev/next arrows when there are more items than fit in one viewport.
 */
export default function CatalogCardCarousel({
  children,
  ariaLabel,
  className,
  visibleOnDesktop = DEFAULT_VISIBLE_DESKTOP,
}: CatalogCardCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isMdUp = useMediaQuery("(min-width: 768px)");
  const { atStart, atEnd, sync } = useScrollEdges(scrollerRef);

  const items = Children.toArray(children).filter(isValidElement);
  const count = items.length;
  const useCarousel = count > visibleOnDesktop;

  const scrollByPage = useCallback(
    (direction: -1 | 1) => {
      const el = scrollerRef.current;
      if (!el) return;
      const gap = isMdUp ? GAP_PX_MD : 24;
      const slideWidth =
        isMdUp && visibleOnDesktop > 0
          ? (el.clientWidth - gap * (visibleOnDesktop - 1)) / visibleOnDesktop + gap
          : el.clientWidth * 0.88 + gap;
      el.scrollBy({ left: direction * slideWidth, behavior: "smooth" });
      window.setTimeout(sync, 400);
    },
    [isMdUp, sync, visibleOnDesktop],
  );

  if (count === 0) return null;

  const desktopBasis =
    visibleOnDesktop > 0
      ? `calc((100% - ${(visibleOnDesktop - 1) * GAP_PX_MD}px) / ${visibleOnDesktop})`
      : "100%";

  return (
    <div className={cn("relative", useCarousel && "md:px-12", className)}>
      {useCarousel && isMdUp ? (
        <>
          <button
            type="button"
            className={cn(navButtonClass, "left-0 -translate-x-1/2 md:left-2 md:translate-x-0")}
            onClick={() => scrollByPage(-1)}
            disabled={atStart}
            aria-label="Previous cards"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            className={cn(navButtonClass, "right-0 translate-x-1/2 md:right-2 md:translate-x-0")}
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
        aria-roledescription={useCarousel ? "carousel" : undefined}
        tabIndex={useCarousel ? 0 : undefined}
        onKeyDown={(e) => {
          if (!useCarousel) return;
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
          "flex items-stretch gap-6 pb-2 md:gap-8",
          useCarousel
            ? "snap-x snap-mandatory overflow-x-auto overscroll-x-contain shamell-scrollbar [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] max-md:px-1"
            : "flex-col md:flex-row md:flex-nowrap",
        )}
      >
        {items.map((child, index) => (
          <div
            key={child.key ?? `catalog-slide-${index}`}
            className={cn(
              "min-w-0 shrink-0",
              useCarousel && "snap-start snap-always",
              useCarousel
                ? "w-[min(88vw,22rem)] md:w-auto md:max-w-none md:flex-[0_0_auto]"
                : "w-full md:flex-1",
            )}
            style={
              useCarousel && isMdUp
                ? { flexBasis: desktopBasis, width: desktopBasis, maxWidth: desktopBasis }
                : undefined
            }
          >
            {child}
          </div>
        ))}
      </div>

      {useCarousel && !isMdUp ? (
        <p className="mt-3 text-center font-body text-xs text-foreground/55 md:hidden">
          Swipe sideways to see more
        </p>
      ) : null}
    </div>
  );
}
