"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildEventLineContactHref } from "@/lib/contactInquiryConstants";

export type EventCatalogItem = {
  id: string;
  eventTypeName: string;
  description: string;
  eventTypes: string[];
  contactInquiryCode?: string | null;
  price: number | null;
  heroImageUrl: string | null;
};

function formatCatalogPriceAmount(value: number): string {
  return new Intl.NumberFormat("es", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

const inquireLinkClass = cn(
  "relative inline-flex min-h-12 flex-1 items-center justify-center gap-2 overflow-hidden border border-gold/35 bg-black/40 px-5 py-3 font-brand text-[10px] tracking-[0.18em] text-gold uppercase",
  "transition-all duration-300",
  "before:pointer-events-none before:absolute before:inset-0 before:translate-x-[-110%] before:bg-[linear-gradient(105deg,transparent,rgba(255,255,255,0.08),transparent)] before:transition-transform before:duration-500",
  "hover:border-gold/55 hover:bg-gold/[0.07] hover:text-gold-light group-hover/card:before:translate-x-[110%]",
);

/** Shamell luxury catalog card — used for dynamic events from GET /api/v1/events */
export function EventCatalogCard({
  service,
  index = 0,
  currencySuffix = "USD",
}: {
  service: EventCatalogItem;
  index?: number;
  /** Shown after the amount when price is set (e.g. USD). */
  currencySuffix?: string;
}) {
  const delayMs = Math.min(index, 8) * 100;
  const inquireHref = buildEventLineContactHref(service.id);
  const hasPrice = service.price != null && !Number.isNaN(Number(service.price));
  const [isTypesCollapsed, setIsTypesCollapsed] = useState(true);
  const eventTypesPanelId = useId();

  return (
    <article
      style={{ animationDelay: `${delayMs}ms` }}
      className={cn(
        "group/card relative flex h-full flex-col overflow-hidden rounded-2xl",
        isTypesCollapsed ? "md:h-176" : "md:h-auto",
        "border border-gold/30",
        "bg-[linear-gradient(168deg,rgba(18,15,12,0.98)_0%,rgba(8,7,5,1)_48%,rgba(3,2,2,1)_100%)]",
        "shadow-[0_18px_56px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.035)]",
        "animate-shamell-exp-card-in",
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={service.heroImageUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-[1.1s] ease-out group-hover/card:scale-[1.04]"
            />
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
          <h3 className="font-brand text-xl tracking-[0.16em] text-gold md:text-[1.35rem] md:tracking-[0.18em]">
            {service.eventTypeName.toUpperCase()}
          </h3>
          <div className="mt-2.5 flex items-center gap-2.5" aria-hidden>
            <span className="text-[10px] leading-none text-gold/75">✦</span>
            <span className="h-px flex-1 bg-linear-to-r from-gold/35 via-gold/15 to-transparent max-sm:max-w-28" />
          </div>

          {hasPrice ? (
            <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-body text-[11px] uppercase tracking-[0.2em] text-foreground/50">Desde</span>
              <span className="font-brand text-2xl tracking-[0.06em] text-gold md:text-[1.65rem]">
                ${formatCatalogPriceAmount(service.price!)}
              </span>
              <span className="font-body text-[11px] uppercase tracking-[0.18em] text-foreground/45">{currencySuffix}</span>
            </div>
          ) : null}
        </header>

        <p className="mt-5 min-h-18 text-[17px] font-body leading-[1.68] text-foreground/78 transition-colors duration-300 group-hover/card:text-foreground/88 md:text-lg md:leading-relaxed">
          {service.description}
        </p>

        <div className="mb-6 mt-6 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h4 className="relative mb-0 inline-block font-brand text-[10px] tracking-[0.24em] text-gold/95">
              EVENT TYPES
              <span
                className="absolute -bottom-1 left-0 h-px w-0 bg-linear-to-r from-transparent via-white/35 to-transparent transition-all duration-500 ease-out group-hover/card:w-full"
                aria-hidden
              />
            </h4>
            <button
              type="button"
              onClick={() => setIsTypesCollapsed((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-black/35 px-2.5 py-1 text-[10px] text-gold/85 transition hover:border-gold/45 hover:text-gold"
              aria-expanded={!isTypesCollapsed}
              aria-controls={eventTypesPanelId}
            >
              <span className="font-body uppercase tracking-[0.14em]">{isTypesCollapsed ? "Abrir" : "Cerrar"}</span>
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", !isTypesCollapsed && "rotate-180")}
                strokeWidth={2}
                aria-hidden
              />
            </button>
          </div>
          {isTypesCollapsed ? (
            <p className="mt-2 font-body text-xs text-foreground/55">
              Pulsa la flecha para ver todos los items de este evento.
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
                    "relative flex gap-2.5 border-b border-white/6 py-2.5 pl-5 font-body text-[15px] leading-snug text-foreground/72 transition-[transform,color] duration-300 first:pt-0 last:border-b-0 last:pb-0 group-hover/card:text-foreground/84 md:text-base",
                    "group-hover/card:translate-x-0.5 motion-reduce:group-hover/card:translate-x-0",
                  )}
                >
                  <span className="absolute left-0 top-[0.55rem] text-[9px] text-gold/85">✦</span>
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
