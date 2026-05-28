"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EventCatalogCardHero } from "@/components/catalog/EventCatalogCardHero";
import { serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";
import { onComingEventDetailHref } from "@/lib/upcomingEventPublicRoutes";

export type OnComingEventHubCardItem = {
  slug: string;
  eventTypeName: string;
  heroImageUrl: string | null;
  heroMediaType?: "IMAGE" | "VIDEO";
};

export function OnComingEventHubCard({ event }: { event: OnComingEventHubCardItem }) {
  const href = onComingEventDetailHref(event.slug);
  const heroIsVideo =
    event.heroMediaType === "VIDEO" ||
    serviceCatalogMediaTypeFromUrl(event.heroImageUrl) === "VIDEO";

  return (
    <article
      className={cn(
        "group/card relative mx-auto flex w-full max-w-[min(100%,17.5rem)] min-h-0 flex-col overflow-hidden rounded-2xl",
        "border border-gold/30",
        "bg-[linear-gradient(168deg,rgba(18,15,12,0.98)_0%,rgba(8,7,5,1)_48%,rgba(3,2,2,1)_100%)]",
        "shadow-[0_18px_56px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.035)]",
        "transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:-translate-y-2 hover:shadow-[0_36px_96px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(255,255,255,0.05)]",
        "motion-reduce:hover:translate-y-0 motion-reduce:transition-colors",
      )}
    >
      <div className="pointer-events-none absolute inset-0 z-20 rounded-2xl" aria-hidden>
        <span className="absolute left-2.5 top-2.5 h-8 w-8 rounded-tl-[8px] border-l border-t border-gold/45" />
        <span className="absolute right-2.5 top-2.5 h-8 w-8 rounded-tr-[8px] border-r border-t border-gold/45" />
        <span className="absolute bottom-2.5 left-2.5 h-8 w-8 rounded-bl-[8px] border-b border-l border-gold/35" />
        <span className="absolute bottom-2.5 right-2.5 h-8 w-8 rounded-br-[8px] border-b border-r border-gold/35" />
      </div>

      <EventCatalogCardHero
        imageUrl={event.heroImageUrl}
        isVideo={heroIsVideo}
        title={event.eventTypeName}
        aspectClassName="aspect-[3/4]"
      />

      <div className="relative z-10 flex flex-1 flex-col px-4 pb-5 pt-3">
        <h2 className="line-clamp-2 text-center font-display text-lg leading-snug text-gold md:text-xl">
          {event.eventTypeName}
        </h2>
        <Link
          href={href}
          className={cn(
            "relative mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 overflow-hidden border border-gold/35 bg-black/40 px-4 py-2.5 font-brand text-[10px] font-semibold tracking-[0.16em] text-gold uppercase",
            "transition-all duration-300",
            "hover:border-gold/55 hover:bg-gold/[0.07] hover:text-gold-light",
          )}
        >
          View more information
          <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
