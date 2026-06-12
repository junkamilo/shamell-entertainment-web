"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildEventLineContactHref } from "@/lib/contactInquiryConstants";
import { formatCatalogPriceAmount } from "@/lib/formatCatalogPrice";
import { serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";
import { EventCatalogCardExpandSections } from "@/components/catalog/EventCatalogCardExpandSections";
import { EventCatalogCardHero } from "@/components/catalog/EventCatalogCardHero";

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
  "relative inline-flex min-h-12 w-full min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden border border-gold/35 bg-black/40 px-3 py-3 font-brand text-xs font-semibold tracking-[0.14em] text-gold uppercase lg:px-5 lg:tracking-[0.16em] xl:tracking-[0.18em]",
  "transition-all duration-300",
  "before:pointer-events-none before:absolute before:inset-0 before:translate-x-[-110%] before:bg-[linear-gradient(105deg,transparent,rgba(255,255,255,0.08),transparent)] before:transition-transform before:duration-500",
  "hover:border-gold/55 hover:bg-gold/[0.07] hover:text-gold-light group-hover/card:before:translate-x-[110%]",
);

/** Shamell luxury catalog card — used for dynamic events from GET /api/v1/events */
export function EventCatalogCard({
  service,
  currencySuffix = "USD",
  primaryActionHref,
  primaryActionLabel = "View event",
  showInquireLink = true,
}: {
  service: EventCatalogItem;
  index?: number;
  /** Shown after the amount when price is set (e.g. USD). */
  currencySuffix?: string;
  primaryActionHref?: string;
  primaryActionLabel?: string;
  showInquireLink?: boolean;
}) {
  const inquireHref = buildEventLineContactHref(service.id);
  const actionHref = primaryActionHref ?? inquireHref;
  const actionLabel = primaryActionHref ? primaryActionLabel : "Inquire";
  const heroIsVideo =
    service.heroMediaType === "VIDEO" ||
    serviceCatalogMediaTypeFromUrl(service.heroImageUrl) === "VIDEO";
  const hasPrice = service.price != null && !Number.isNaN(Number(service.price));

  return (
    <article
      className={cn(
        "@container group/card relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl",
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

      <EventCatalogCardHero
        imageUrl={service.heroImageUrl}
        isVideo={heroIsVideo}
        title={service.eventTypeName}
      />

      {/* Body */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-4 pb-5 pt-4 lg:px-6 lg:pb-6 lg:pt-5">
        <header className="shrink-0 border-b border-white/[0.07] pb-3 transition-colors duration-500 group-hover/card:border-gold/15 lg:pb-4">
          <h3 className="text-balance font-brand text-base font-semibold leading-snug tracking-[0.12em] text-gold lg:text-xl lg:tracking-[0.16em] xl:text-2xl xl:tracking-[0.18em]">
            {service.eventTypeName.toUpperCase()}
          </h3>
          <div className="mt-2.5 flex items-center justify-center gap-2.5" aria-hidden>
            <span className="h-px flex-1 max-w-16 bg-linear-to-r from-transparent via-gold/35 to-gold/15 sm:max-w-24" />
            <span className="text-xs leading-none text-gold/80">✦</span>
            <span className="h-px flex-1 max-w-16 bg-linear-to-l from-transparent via-gold/35 to-gold/15 sm:max-w-24" />
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

        <EventCatalogCardExpandSections
          description={service.description}
          eventTypes={service.eventTypes}
          cardId={service.id}
        />

        <div className="mt-auto shrink-0 border-t border-gold/14 pt-4 lg:mt-6 lg:pt-5">
          <Link href={actionHref} prefetch={false} className={cn(inquireLinkClass, "w-full")}>
            <span className="relative z-10">{actionLabel}</span>
            <ArrowRight className="relative z-10 h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
          </Link>
          {showInquireLink && primaryActionHref ? (
            <Link
              href={inquireHref}
              prefetch={false}
              className="mt-3 block text-center font-brand text-[10px] tracking-[0.14em] text-gold/75 uppercase hover:text-gold"
            >
              Or inquire without booking
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
