"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

type Props = {
  items: string[];
};

function OnComingEventItemCard({
  item,
  index,
  prefersReducedMotion,
  mobileCarousel,
}: {
  item: string;
  index: number;
  prefersReducedMotion: boolean;
  mobileCarousel?: boolean;
}) {
  const displayIndex = String(index + 1).padStart(2, "0");

  return (
    <motion.li
      className={cn(
        "group/item relative list-none overflow-hidden rounded-xl",
        mobileCarousel && "w-[17rem] max-w-[85vw] shrink-0 snap-start",
        "border border-gold/28",
        "bg-[linear-gradient(145deg,rgba(22,18,14,0.92)_0%,rgba(6,5,4,0.96)_100%)]",
        "shadow-[0_8px_28px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.04)]",
        "transition-[border-color,box-shadow] duration-400",
        "hover:border-gold/45 hover:shadow-[0_14px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]",
      )}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      whileHover={prefersReducedMotion ? undefined : { y: -3 }}
    >
      <div className="pointer-events-none absolute inset-0 z-10 rounded-xl" aria-hidden>
        <span className="absolute left-2.5 top-2.5 h-6 w-6 rounded-tl-md border-l border-t border-gold/40" />
        <span className="absolute bottom-2.5 right-2.5 h-6 w-6 rounded-br-md border-b border-r border-gold/30" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/item:opacity-100"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(90%_80%_at_0%_50%,rgba(197,165,90,0.08),transparent_55%)]" />
      </div>

      <div
        className={cn(
          "relative flex items-center gap-4 py-4 md:px-5 md:py-4",
          mobileCarousel ? "px-5 py-5" : "px-4",
        )}
      >
        <div
          className={cn(
            "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
            "border border-gold/35 bg-gold/8",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
            "transition-transform duration-400 group-hover/item:scale-105 group-hover/item:border-gold/55",
          )}
        >
          <span
            className="font-brand text-lg leading-none text-gold/90 transition-colors duration-400 group-hover/item:text-gold"
            aria-hidden
          >
            ✦
          </span>
          <span
            className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-black/80 px-1 font-brand text-[9px] tracking-wider text-gold/90 ring-1 ring-gold/40"
            aria-hidden
          >
            {displayIndex}
          </span>
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="font-body text-sm font-medium leading-snug wrap-anywhere text-foreground/92 md:text-base">
            {item}
          </p>
          <span className="mt-1 block h-px w-8 bg-linear-to-r from-gold/50 to-transparent opacity-60 transition-all duration-400 group-hover/item:w-14 group-hover/item:opacity-100" />
        </div>

        <span
          className="hidden shrink-0 font-brand text-[10px] tracking-[0.2em] text-gold/30 transition-colors group-hover/item:text-gold/55 sm:block"
          aria-hidden
        >
          ✦
        </span>
      </div>
    </motion.li>
  );
}

export function OnComingEventItemsSection({ items }: Props) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  if (items.length === 0) return null;

  return (
    <section
      className="mt-10 w-full min-w-0 max-w-full"
      aria-labelledby="on-coming-event-items-heading"
    >
      <div className="w-full text-center">
        <h2
          id="on-coming-event-items-heading"
          className="font-brand text-xs tracking-[0.2em] text-gold/90"
        >
          WHAT&apos;S INCLUDED
        </h2>
        <p className="mx-auto mt-2 max-w-md font-body text-sm text-pretty text-foreground/60">
          Highlights of this experience
        </p>
      </div>

      {/* Mobile: horizontal scroll isolated from page width */}
      <div className="mt-7 min-w-0 w-full sm:hidden">
        <div
          className={cn(
            "shamell-scrollbar -mx-4 min-w-0 overflow-x-auto px-6 pb-2",
            "snap-x snap-mandatory scroll-pl-6 scroll-pr-6",
            "overscroll-x-contain [-webkit-overflow-scrolling:touch]",
          )}
        >
          <ul className="flex w-max gap-4">
            {items.map((item, index) => (
              <OnComingEventItemCard
                key={`mobile-${item}-${index}`}
                item={item}
                index={index}
                prefersReducedMotion={prefersReducedMotion}
                mobileCarousel
              />
            ))}
          </ul>
        </div>
      </div>

      {/* Tablet/desktop: grid */}
      <ul className="mt-5 hidden min-w-0 grid-cols-2 gap-4 sm:grid">
        {items.map((item, index) => (
          <OnComingEventItemCard
            key={`desktop-${item}-${index}`}
            item={item}
            index={index}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
      </ul>
    </section>
  );
}
