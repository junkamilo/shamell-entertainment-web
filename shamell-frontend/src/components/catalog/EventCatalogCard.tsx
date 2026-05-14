"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildEventLineContactHref } from "@/lib/contactInquiryConstants";
import { formatCatalogPriceAmount } from "@/lib/formatCatalogPrice";
import { serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";

export type EventCatalogItem = {
  id: string;
  eventTypeName: string;
  description: string;
  eventTypes: string[];
  contactInquiryCode?: string | null;
  price: number | null;
  heroImageUrl: string | null;
  /** First catalog media; drives hero `<img>` vs `<video>`. */
  heroMediaType?: "IMAGE" | "VIDEO";
};

const inquireLinkClass = cn(
  "relative inline-flex min-h-12 flex-1 items-center justify-center gap-2 overflow-hidden border border-gold/35 bg-black/40 px-5 py-3 font-brand text-xs font-semibold tracking-[0.16em] text-gold uppercase md:min-h-12 md:tracking-[0.18em]",
  "transition-all duration-300",
  "before:pointer-events-none before:absolute before:inset-0 before:translate-x-[-110%] before:bg-[linear-gradient(105deg,transparent,rgba(255,255,255,0.08),transparent)] before:transition-transform before:duration-500",
  "hover:border-gold/55 hover:bg-gold/[0.07] hover:text-gold-light group-hover/card:before:translate-x-[110%]",
);

/** Shamell luxury catalog card — used for dynamic events from GET /api/v1/events */
export function EventCatalogCard({
  service,
  currencySuffix = "USD",
}: {
  service: EventCatalogItem;
  index?: number;
  /** Shown after the amount when price is set (e.g. USD). */
  currencySuffix?: string;
}) {
  const inquireHref = buildEventLineContactHref(service.id);
  const heroIsVideo =
    service.heroMediaType === "VIDEO" ||
    serviceCatalogMediaTypeFromUrl(service.heroImageUrl) === "VIDEO";
  const hasPrice = service.price != null && !Number.isNaN(Number(service.price));
  const [isTypesCollapsed, setIsTypesCollapsed] = useState(true);
  const eventTypesPanelId = useId();

  return (
    <article
      className={cn(
        "group/card relative flex h-full flex-col overflow-hidden rounded-2xl",
        isTypesCollapsed ? "md:h-176" : "md:h-auto",
        "border border-gold/30",
        "bg-[linear-gradient(168deg,rgba(18,15,12,0.98)_0%,rgba(8,7,5,1)_48%,rgba(3,2,2,1)_100%)]",
        "shadow-[0_18px_56px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.035)]",
        "transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:-translate-y-2 hover:shadow-[0_36px_96px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(255,255,255,0.05)]",
        "motion-reduce:hover:translate-y-0 motion-reduce:transition-colors",
      )}
    >
      {/* Open-corner gold frame */}
      <div className="pointer-events-none absolute inset-0 z-20 rounded-2xl" aria-hidden>
        <span className="absolute left-4 top-4 h-14 w-14 rounded-tl-[10px] border-l border-t border-gold/45" />
        <span className="absolute right-4 top-4 h-14 w-14 rounded-tr-[10px] border-r border-t border-gold/45" />
        <span className="absolute bottom-4 left-4 h-14 w-14 rounded-bl-[10px] border-b border-l border-gold/35" />
        <span className="absolute bottom-4 right-4 h-14 w-14 rounded-br-[10px] border-b border-r border-gold/35" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
        aria-hidden
      >
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(120%_65%_at_50%_-10%,rgba(197,165,90,0.09),transparent_52%)]" />
      </div>

      {/* Hero: full-bleed */}
      <div className="relative z-10 aspect-16/10 w-full shrink-0 overflow-hidden bg-[#0a0908]">
        {service.heroImageUrl ? (
          <>
            {heroIsVideo ? (
              <video
                src={service.heroImageUrl}
                className="h-full w-full object-cover transition-transform duration-[1.1s] ease-out group-hover/card:scale-[1.04]"
                muted
                playsInline
                loop
                autoPlay
                aria-hidden
              />
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={service.heroImageUrl}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-[1.1s] ease-out group-hover/card:scale-[1.04]"
                />
              </>
            )}
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(6,5,4,0.15)_0%,transparent_42%,rgba(4,3,2,0.72)_100%)]"
              aria-hidden
            />
          </>
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(197,165,90,0.14)_0%,transparent_58%)]"
            aria-hidden
          >
            <Sparkles className="h-11 w-11 text-gold/22 transition-colors duration-500 group-hover/card:text-gold/35" strokeWidth={1.2} />
          </div>
        )}

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-5 h-24 bg-linear-to-t from-black/50 to-transparent opacity-90"
          aria-hidden
        />
      </div>

      {/* Body */}
      <div className="relative z-10 flex flex-1 flex-col px-6 pb-6 pt-5 md:px-7 md:pb-7 md:pt-6">
        <header className="border-b border-white/[0.07] pb-4 transition-colors duration-500 group-hover/card:border-gold/15">
          <h3 className="font-brand text-xl font-semibold tracking-[0.16em] text-gold md:text-2xl md:tracking-[0.18em]">
            {service.eventTypeName.toUpperCase()}
          </h3>
          <div className="mt-2.5 flex items-center gap-2.5" aria-hidden>
            <span className="text-xs leading-none text-gold/80">✦</span>
            <span className="h-px flex-1 bg-linear-to-r from-gold/35 via-gold/15 to-transparent max-sm:max-w-28" />
          </div>

          {hasPrice ? (
            <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-body text-sm font-medium uppercase tracking-[0.18em] text-foreground/78">
                From
              </span>
              <span className="font-brand text-2xl font-semibold tracking-[0.06em] text-gold md:text-[1.75rem]">
                ${formatCatalogPriceAmount(service.price!)}
              </span>
              <span className="font-body text-sm font-medium uppercase tracking-[0.16em] text-foreground/72">
                {currencySuffix}
              </span>
            </div>
          ) : null}
        </header>

        <p className="mt-5 min-h-18 font-body text-base font-medium leading-[1.7] text-foreground/88 transition-colors duration-300 group-hover/card:text-foreground/95 md:text-lg md:leading-relaxed">
          {service.description}
        </p>

        <div className="mb-6 mt-6 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h4 className="relative mb-0 inline-block font-brand text-sm font-semibold tracking-[0.2em] text-gold/95 md:text-base md:tracking-[0.22em]">
              EVENT TYPES
              <span
                className="absolute -bottom-1 left-0 h-px w-0 bg-linear-to-r from-transparent via-white/35 to-transparent transition-all duration-500 ease-out group-hover/card:w-full"
                aria-hidden
              />
            </h4>
            <button
              type="button"
              onClick={() => setIsTypesCollapsed((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-black/35 px-3 py-2 font-brand text-xs font-semibold text-gold/95 transition hover:border-gold/45 hover:text-gold md:px-3.5"
              aria-expanded={!isTypesCollapsed}
              aria-controls={eventTypesPanelId}
            >
              <span className="font-body text-xs font-semibold uppercase tracking-[0.12em]">
                {isTypesCollapsed ? "Expand" : "Collapse"}
              </span>
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", !isTypesCollapsed && "rotate-180")}
                strokeWidth={2}
                aria-hidden
              />
            </button>
          </div>
          {isTypesCollapsed ? (
            <p className="mt-2 font-body text-base font-medium leading-snug text-foreground/80">
              Tap the arrow to see every item included in this tier.
            </p>
          ) : null}
          <div
            id={eventTypesPanelId}
            className={cn(
              "relative mt-4 pl-1 transition-all duration-300",
              isTypesCollapsed ? "max-h-0 overflow-hidden opacity-0" : "max-h-88 overflow-y-auto pr-1 opacity-100",
            )}
          >
            <span
              className="absolute bottom-1 left-[0.42rem] top-1 w-px bg-linear-to-b from-white/6 via-white/22 to-white/6 transition-all duration-500 group-hover/card:via-white/30"
              aria-hidden
            />
            <ul className="relative">
              {service.eventTypes.map((item, i) => (
                <li
                  key={`${service.id}-${i}`}
                  style={{ transitionDelay: `${i * 35}ms` }}
                  className={cn(
                    "relative flex gap-2.5 border-b border-white/6 py-2.5 pl-5 font-body text-base font-medium leading-snug text-foreground/85 transition-[transform,color] duration-300 first:pt-0 last:border-b-0 last:pb-0 group-hover/card:text-foreground/92 md:text-lg md:leading-snug",
                    "group-hover/card:translate-x-0.5 motion-reduce:group-hover/card:translate-x-0",
                  )}
                >
                  <span className="absolute left-0 top-[0.55rem] text-xs text-gold/85 md:top-[0.62rem]">✦</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-auto border-t border-gold/14 pt-5">
          <Link href={inquireHref} prefetch={false} className={cn(inquireLinkClass, "w-full")}>
            <span className="relative z-10">Inquire</span>
            <ArrowRight className="relative z-10 h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
